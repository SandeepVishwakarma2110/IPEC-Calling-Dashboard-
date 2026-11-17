require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const readline = require('readline');
const mongoose = require('mongoose');
const connectDB = require('../backend/config/db');
const { Client } = require('../backend/models');
const password = require('../backend/utils/password');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  }));
}

function askHidden(question) {
  const stdin = process.stdin;
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    return Promise.reject(new Error('Run this script in an interactive terminal.'));
  }

  return new Promise((resolve, reject) => {
    const wasRaw = stdin.isRaw;
    let value = '';
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function finish(error) {
      stdin.off('data', onData);
      stdin.setRawMode(wasRaw);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    }

    function onData(char) {
      if (char === '\u0003') return finish(new Error('Password reset cancelled.'));
      if (char === '\r' || char === '\n') return finish();
      if (char === '\u007f' || char === '\b') {
        value = value.slice(0, -1);
      } else if (char >= ' ') {
        value += char;
      }
    }

    stdin.on('data', onData);
  });
}

async function main() {
  const email = (await ask('Client email: ')).trim();
  if (!email) throw new Error('Email is required.');

  const newPassword = await askHidden('New password (minimum 8 characters): ');
  const confirmation = await askHidden('Confirm new password: ');
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
  if (newPassword !== confirmation) throw new Error('Passwords do not match.');

  await connectDB();
  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const client = await Client.findOne({ email: new RegExp(`^${escapedEmail}$`, 'i') }).lean();
  if (!client) throw new Error('No client account found with that email.');

  const result = await Client.updateOne(
    { _id: client._id },
    { $set: { passwordHash: password.hash(newPassword), updatedAt: new Date() } },
  );
  if (result.matchedCount !== 1) throw new Error('The client account was not updated.');
  console.log(`Password reset successfully for ${client.email}.`);
}

main()
  .catch((error) => {
    console.error(`Password reset failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
