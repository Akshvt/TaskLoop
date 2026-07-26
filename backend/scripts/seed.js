require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const founderEmail = process.env.FOUNDER_EMAIL;
    if (!founderEmail) {
      console.error('FOUNDER_EMAIL env var is not set');
      process.exit(1);
    }

    const existing = await User.findOne({ email: founderEmail });
    if (existing) {
      console.log('Founder account already exists — skipping');
    } else {
      const passwordHash = await bcrypt.hash('namhya2026', 10);
      await User.create({
        name:  'Founder',
        email: founderEmail,
        passwordHash,
        role:  'founder',
      });
      console.log('Founder account created');
    }

    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
