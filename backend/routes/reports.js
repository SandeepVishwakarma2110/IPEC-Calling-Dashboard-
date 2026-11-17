const router = require('express').Router();
const mongoose = require('mongoose');
const wrap = require('../utils/asyncHandler');
const { CallLog } = require('../models');
const purpose = require('../utils/purpose');

const IST = 19800000; // +5:30 in milliseconds
const DAY = 864e5;
const ymd = (d) => new Date(d.getTime() + IST).toISOString().slice(0, 10);
const valid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

router.get('/', wrap(async (req, res) => {
  const to = valid(req.query.to) ? req.query.to : ymd(new Date());
  const from = valid(req.query.from) ? req.query.from : ymd(new Date(Date.now() - 29 * DAY));
  const start = new Date(`${from}T00:00:00+05:30`);
  const end = new Date(`${to}T23:59:59.999+05:30`);
  if (isNaN(start) || isNaN(end) || start > end) return res.status(400).json({ message: 'Invalid date range' });
  if (end - start > 366 * DAY) return res.status(400).json({ message: 'Please choose a range of one year or less' });

  const logs = await CallLog.find(
    { clientId: new mongoose.Types.ObjectId(req.user.id), startedAt: { $gte: start, $lte: end } },
    'phoneNumber direction startedAt durationMs billedSeconds transcript'
  ).limit(50000).lean();

  // one row for every day in the range (even days with 0 calls)
  const days = new Map();
  for (let t = start.getTime(); t <= end.getTime(); t += DAY)
    days.set(ymd(new Date(t)), { date: ymd(new Date(t)), inbound: 0, outbound: 0, total: 0, minutes: 0 });

  const purposes = new Map(), callers = new Map(), hours = Array(24).fill(0);
  const totals = { calls: 0, inbound: 0, outbound: 0, minutes: 0, avgSeconds: 0 };
  let durSum = 0;

  for (const l of logs) {
    const dir = l.direction === 'inbound' ? 'inbound' : 'outbound';
    const day = days.get(ymd(l.startedAt));
    if (!day) continue;
    day[dir]++; day.total++; day.minutes += (l.billedSeconds || 0) / 60;
    totals.calls++; totals[dir]++; totals.minutes += (l.billedSeconds || 0) / 60; durSum += (l.durationMs || 0) / 1000;
    hours[new Date(l.startedAt.getTime() + IST).getUTCHours()]++;

    const label = purpose(l.transcript);
    const p = purposes.get(label) || { label, count: 0, inbound: 0, outbound: 0, callers: new Map() };
    p.count++; p[dir]++; purposes.set(label, p);

    // which phone numbers called for this purpose
    const c = p.callers.get(l.phoneNumber) || { phone: l.phoneNumber, calls: 0, lastAt: l.startedAt };
    c.calls++; if (l.startedAt > c.lastAt) c.lastAt = l.startedAt;
    p.callers.set(l.phoneNumber, c);

    callers.set(l.phoneNumber, (callers.get(l.phoneNumber) || 0) + 1);
  }
  totals.avgSeconds = totals.calls ? durSum / totals.calls : 0;

  res.json({
    from, to, totals, hours,
    days: [...days.values()],
    purposes: [...purposes.values()]
      .map((p) => ({ label: p.label, count: p.count, inbound: p.inbound, outbound: p.outbound,
        callers: [...p.callers.values()].sort((a, b) => b.calls - a.calls || b.lastAt - a.lastAt) }))
      .sort((a, b) => b.count - a.count),
    topCallers: [...callers.entries()].map(([phone, calls]) => ({ phone, calls })).filter((c) => c.calls > 1).sort((a, b) => b.calls - a.calls).slice(0, 5),
  });
}));
module.exports = router;