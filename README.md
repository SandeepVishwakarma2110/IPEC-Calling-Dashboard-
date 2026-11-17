# IPEC Dashboard (React + Tailwind + Node + Express + MongoDB)

## Run in development (2 terminals)
1. Terminal 1, in this folder: `npm install` then `npm run dev`  (API on port 5000)
2. Terminal 2: `cd frontend` then `npm install` then `npm run dev`
3. Open http://localhost:5173 and sign in with a client's email and password from the `clients` collection.

## Run as one app (production)
`npm run build` then `npm start`, open http://localhost:5000

Edit `.env` first (MONGO_URI, JWT_SECRET). If call logs are in the `logs` collection, set LOGS_COLLECTION=logs.

## Reset a client password
If you administer this app and a client has forgotten their password, run `node scripts/reset-client-password.js` from the project root in an interactive terminal. Enter the email for the account in the `clients` collection and the new password when prompted. Password input is hidden. The script replaces only that account's password hash; it does not recover the old password.
