const mongoose = require('mongoose');
const { AuditLog } = require('../models');
const str = (v) => (v === undefined || v === null ? null : typeof v === 'string' ? v : JSON.stringify(v));

// actor starts with "dashboard" so the Audit logs page shows only what happened here
module.exports = (req, client, { kind = 'config', action, field = null, before, after }) =>
  AuditLog.create({
    clientId: new mongoose.Types.ObjectId(String(client._id || client.id)), clientName: client.name,
    kind, action, field, before: str(before), after: str(after),
    actor: 'dashboard:' + (client.email || ''), actorIp: req.ip || null,
    createdAt: new Date(), updatedAt: new Date(),
  });
