const mongoose = require('mongoose');
// strict:false -> reads whatever fields exist in your collections
const make = (name, coll) => mongoose.model(name, new mongoose.Schema({}, { strict: false }), coll);
module.exports = {
  Client: make('Client', 'clients'),
  CallLog: make('CallLog', process.env.LOGS_COLLECTION || 'Ipeccalllogs'),
  AuditLog: make('AuditLog', 'auditlogs'),
};
