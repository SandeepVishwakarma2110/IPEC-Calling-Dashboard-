// Works with hashes like: scrypt$16384$8$1$<salt base64>$<hash base64>
const crypto = require('crypto');
const run = (pw, salt, N, r, p, len) => crypto.scryptSync(pw, salt, len, { N, r, p, maxmem: 256 * N * r });

// returns 'b64' | 'utf8' (how the salt was used) or null when the password is wrong
function verify(password, stored) {
  const [scheme, N, r, p, salt, hash] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !hash) return null;
  const want = Buffer.from(hash, 'base64');
  const tries = [['b64', Buffer.from(salt, 'base64')], ['utf8', Buffer.from(salt)]];
  for (const [kind, s] of tries) {
    const got = run(password, s, +N, +r, +p, want.length);
    if (got.length === want.length && crypto.timingSafeEqual(got, want)) return kind;
  }
  return null;
}
// keeps the same salt convention as the existing hash so other apps can still verify it
function hash(password, kind = 'b64') {
  const salt = crypto.randomBytes(16), saltB64 = salt.toString('base64');
  const key = run(password, kind === 'utf8' ? Buffer.from(saltB64) : salt, 16384, 8, 1, 64);
  return `scrypt$16384$8$1$${saltB64}$${key.toString('base64')}`;
}
module.exports = { verify, hash };
