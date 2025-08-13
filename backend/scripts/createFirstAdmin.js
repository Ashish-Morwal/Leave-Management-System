/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function createFirstAdmin() {
  try {
    await connectDB();
    console.log("🔗 Connected to database");

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: "Admin" });
    if (existingAdmin) {
      console.log("❌ Admin user already exists!");
      console.log(`Name: ${existingAdmin.name}`);
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      await mongoose.connection.close();
      return;
    }

    // Create the first admin user
    const adminData = {
      name: "System Administrator",
      email: "admin@company.com",
      password: "admin123456", // Change this password!
      role: "Admin",
      // No joiningDate required for Admin role
      leaveBalance: 0, // Admins don't need leave balance
    };

    const admin = await User.create(adminData);
    console.log("✅ First admin user created successfully!");
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Password: ${adminData.password}`);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
    console.log("⚠️  Delete this script after use for security!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin:", err);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

createFirstAdmin();

