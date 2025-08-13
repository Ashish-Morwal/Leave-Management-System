/* eslint-disable no-console */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function changeUserRole() {
  try {
    await connectDB();

    const email = "ashishmorwal001@gmail.com";
    const newRole = "Employee"; // Change from Admin to Employee

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: newRole },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Role changed successfully!`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`New Role: ${user.role}`);
    console.log(`\nNow you should see yourself in the employee list!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Role change failed:", err);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
}

changeUserRole();


