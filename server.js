require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const connectDB = require('./backend/config/db');
const auth = require('./backend/middleware/auth');

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/reports', auth, require('./backend/routes/reports')); // NEW LINE
app.use('/api', auth, require('./backend/routes/data'));
// Production: static serving of the frontend
const frontendDist = fs.existsSync(path.join(__dirname, 'frontend', 'dist'))
  ? path.join(__dirname, 'frontend', 'dist')
  : path.join(__dirname, '..', '..', 'frontend', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Server error' }); });

connectDB().then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
});
