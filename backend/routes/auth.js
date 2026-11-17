const router = require('express').Router();
const jwt = require('jsonwebtoken');
const wrap = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { Client } = require('../models');
const pw = require('../utils/password');
const audit = require('../utils/audit');
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password' });
  const client = await Client.findOne({ email: new RegExp('^' + esc(String(email).trim()) + '$', 'i') }).lean();
  if (!client || !pw.verify(String(password), client.passwordHash))
    return res.status(401).json({ message: 'Incorrect email or password' });
  await audit(req, client, { kind: 'auth', action: 'client.login' });
  const token = jwt.sign({ id: String(client._id), email: client.email, name: client.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, client: { name: client.name, email: client.email } });
}));

router.post('/logout', auth, wrap(async (req, res) => {
  const client = await Client.findById(req.user.id, 'name email').lean();
  if (client) await audit(req, client, { kind: 'auth', action: 'client.logout' });
  res.json({ ok: true });
}));

router.post('/change-password', auth, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });
  const client = await Client.findById(req.user.id).lean();
  const kind = client && pw.verify(String(currentPassword || ''), client.passwordHash);
  if (!kind) return res.status(400).json({ message: 'Current password is incorrect' });
  await Client.updateOne({ _id: client._id }, { $set: { passwordHash: pw.hash(String(newPassword), kind), updatedAt: new Date() } });
  await audit(req, client, { kind: 'auth', action: 'password.changed' });
  res.json({ ok: true });
}));
module.exports = router;
