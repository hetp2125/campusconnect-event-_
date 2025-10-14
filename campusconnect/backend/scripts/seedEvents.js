// scripts/seedEvents.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
require('dotenv').config({ path: __dirname + '/../.env' });

const events = [
  {
    name: 'Campus Orientation',
    date: new Date('2025-08-01'),
    location: 'Main Auditorium',
    organizer: 'Student Affairs',
  },
  {
    name: 'Tech Fest',
    date: new Date('2025-09-15'),
    location: 'Innovation Hall',
    organizer: 'Tech Club',
  },
  {
    name: 'Cultural Night',
    date: new Date('2025-10-10'),
    location: 'Open Grounds',
    organizer: 'Cultural Committee',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await Event.deleteMany({});
    await Event.insertMany(events);
    console.log('✅ Sample events seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
