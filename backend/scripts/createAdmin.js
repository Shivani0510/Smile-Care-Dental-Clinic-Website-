// One-time script to create the initial admin account.
// Run with: npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin with email ${email} already exists. Nothing to do.`);
    process.exit(0);
  }

  await Admin.create({ email, password });
  console.log(`Admin account created for ${email}. You can now log in at /admin.html`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
