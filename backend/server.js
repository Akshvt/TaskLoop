require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const taskRoutes        = require('./routes/tasks');
const announcementRoutes = require('./routes/announcements');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/announcements', announcementRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── HTTP Seed Route ────────────────────────────────────────────────────────
app.get('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const founderEmail = 'founder@namhyafoods.com';

    const existingFounder = await User.findOne({ role: 'founder' });
    if (existingFounder) {
      return res.status(403).json({ error: 'Founder already seeded' });
    }

    const passwordHash = await bcrypt.hash('namhya2026', 10);
    await User.create({
      name:  'Founder',
      email: founderEmail,
      passwordHash,
      role:  'founder',
    });

    res.json({ message: 'Founder account created successfully with email: ' + founderEmail });
  } catch (err) {
    console.error('HTTP Seed error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── DB + Server start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    // Start cron jobs after DB is ready
    const { startCronJobs } = require('./services/cronService');
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
