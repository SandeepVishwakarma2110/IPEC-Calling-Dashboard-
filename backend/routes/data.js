const router = require('express').Router();
const mongoose = require('mongoose');
const wrap = require('../utils/asyncHandler');
const { Client, CallLog, AuditLog } = require('../models');
const audit = require('../utils/audit');

const cidOf = (req) => new mongoose.Types.ObjectId(req.user.id);
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const paging = (q) => { const limit = Math.min(parseInt(q.limit) || 10, 100), page = Math.max(parseInt(q.page) || 1, 1); return { limit, page, skip: (page - 1) * limit }; };
const audioBuffer = (data) => {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (data && typeof data.value === 'function') {
    const value = data.value(true);
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  }
  if (data && (Buffer.isBuffer(data.buffer) || data.buffer instanceof Uint8Array)) {
    const length = Number.isInteger(data.position) ? data.position : data.buffer.byteLength;
    return Buffer.from(data.buffer.buffer, data.buffer.byteOffset || 0, length);
  }
  return null;
};

router.get('/profile', wrap(async (req, res) => {
  const c = await Client.findById(req.user.id, 'name email phoneNumber talktimeMinutes').lean();
  res.json(c);
}));

router.get('/logs', wrap(async (req, res) => {
  const { limit, page, skip } = paging(req.query);
  const f = { clientId: cidOf(req) };
  if (req.query.direction) f.direction = String(req.query.direction);
  if (req.query.q) f.phoneNumber = new RegExp(esc(req.query.q));
  const [rows, total, g] = await Promise.all([
    CallLog.aggregate([
      { $match: f },
      { $sort: { startedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: {
        callSid: 1, phoneNumber: 1, direction: 1, startedAt: 1, endedAt: 1,
        durationMs: 1, billedSeconds: 1, billedMinutes: 1, createdAt: 1, updatedAt: 1,
        transcriptPreview: { $substrCP: [{ $ifNull: ['$transcript', ''] }, 0, 160] },
        hasTranscript: { $ne: [{ $substrCP: [{ $ifNull: ['$transcript', ''] }, 0, 1] }, ''] },
        recordingUrl: { $ifNull: [
          '$recording.url', '$recording.recordingUrl', '$recording.mediaUrl',
          '$recording.fileUrl', '$recording.link', '$recording.publicUrl', '$recording.secure_url',
        ] },
        hasRecording: { $or: [
          { $eq: [{ $type: '$recording.audioData' }, 'binData'] },
          ...['url', 'recordingUrl', 'mediaUrl', 'fileUrl', 'link', 'publicUrl', 'secure_url']
            .map((key) => ({ $and: [
              { $eq: [{ $type: `$recording.${key}` }, 'string'] },
              { $ne: [`$recording.${key}`, ''] },
            ] })),
        ] },
      } },
    ]),
    CallLog.countDocuments(f),
    CallLog.aggregate([{ $match: { clientId: cidOf(req) } }, { $group: { _id: '$direction', n: { $sum: 1 }, sec: { $sum: '$billedSeconds' } } }]),
  ]);
  const items = rows.map((row) => {
    const recordingUrl = typeof row.recordingUrl === 'string' && row.recordingUrl ? row.recordingUrl : null;
    return {
      ...row,
      recordingUrl,
      hasRecording: !!row.hasRecording || !!recordingUrl,
      recordingPath: row.hasRecording && !recordingUrl ? `/api/logs/${row._id}/recording` : null,
    };
  });
  const by = (d) => g.find((x) => x._id === d)?.n || 0;
  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1),
    stats: { total: by('inbound') + by('outbound'), inbound: by('inbound'), outbound: by('outbound'), talkMinutes: g.reduce((a, x) => a + (x.sec || 0), 0) / 60 } });
}));

router.get('/logs/:id/transcript', wrap(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid call log ID' });
  const log = await CallLog.findOne(
    { _id: req.params.id, clientId: cidOf(req) },
    'transcript'
  ).lean();
  if (!log) return res.status(404).json({ message: 'Call log not found' });
  res.json({ transcript: log.transcript || '' });
}));

router.get('/logs/:id/recording', wrap(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid call log ID' });
  const log = await CallLog.findOne(
    { _id: req.params.id, clientId: cidOf(req) },
    'recording'
  ).lean();
  const recording = log && log.recording;
  const audio = recording && audioBuffer(recording.audioData);
  if (!audio || !audio.length) return res.status(404).json({ message: 'Recording audio is unavailable' });
  const contentType = typeof recording.contentType === 'string' && /^audio\/[a-z0-9.+-]+$/i.test(recording.contentType)
    ? recording.contentType
    : 'audio/wav';
  res.set({
    'Content-Type': contentType,
    'Content-Length': String(audio.length),
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(audio);
}));

router.get('/audit-logs', wrap(async (req, res) => {
  const { limit, page, skip } = paging(req.query);
  const f = { clientId: cidOf(req), $or: [{ kind: 'auth' }, { actor: /^dashboard/ }] };
  if (req.query.type === 'auth') f.$or = [{ kind: 'auth' }];
  if (req.query.type === 'changes') { f.$or = [{ actor: /^dashboard/, kind: 'config' }]; }
  const [items, total] = await Promise.all([
    AuditLog.find(f, 'kind action field before after actorIp createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(f),
  ]);
  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
}));

const SETTINGS = 'agentActive isActiveIncoming isActiveOutbound hours';
router.get('/settings', wrap(async (req, res) => res.json(await Client.findById(req.user.id, SETTINGS).lean())));

const days = (a) => [...new Set((Array.isArray(a) ? a : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort();
const hhmm = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

router.patch('/settings', wrap(async (req, res) => {
  const b = req.body || {};
  const client = await Client.findById(req.user.id).lean();
  const set = {}, changes = [];
  for (const k of ['agentActive', 'isActiveIncoming', 'isActiveOutbound'])
    if (typeof b[k] === 'boolean' && b[k] !== client[k]) { set[k] = b[k]; changes.push([k, client[k], b[k]]); }
  for (const d of ['inbound', 'outbound']) {
    const h = b.hours && b.hours[d]; if (!h) continue;
    const old = (client.hours && client.hours[d]) || {};
    const next = { ...old, allDay: !!h.allDay, days: days(h.days) };
    if (d === 'outbound') { if (hhmm(h.start)) next.start = h.start; if (hhmm(h.end)) next.end = h.end; }
    if (JSON.stringify(next) !== JSON.stringify(old)) { set['hours.' + d] = next; changes.push(['hours.' + d, old, next]); }
  }
  if (changes.length) {
    set.updatedAt = new Date();
    await Client.updateOne({ _id: client._id }, { $set: set });
    for (const [field, before, after] of changes) await audit(req, client, { action: 'client.updated', field, before, after });
  }
  res.json(await Client.findById(req.user.id, SETTINGS).lean());
}));
module.exports = router;
