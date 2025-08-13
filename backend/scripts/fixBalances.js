#!/usr/bin/env node

const mongoose = require("mongoose");
const User = require("../models/User");
const { ANNUAL_LEAVE_LIMIT } = require("../utils/constants");

// MongoDB connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/leave-management";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error disconnecting from MongoDB:", error.message);
  }
}

async function fixLeaveBalances() {
  try {
    console.log("\n🔧 Starting Leave Balance Normalization...");
    console.log(`📊 Annual Leave Limit: ${ANNUAL_LEAVE_LIMIT} days`);

    // Find all users with leave balance exceeding the limit
    const usersToFix = await User.find({
      leaveBalance: { $gt: ANNUAL_LEAVE_LIMIT },
    });

    console.log(
      `\n📋 Found ${usersToFix.length} users with excessive leave balance:`
    );

    if (usersToFix.length === 0) {
      console.log("✅ All users already have normalized leave balances!");
      return { updated: 0, unchanged: 0 };
    }

    // Display users that will be updated
    usersToFix.forEach((user) => {
      console.log(
        `  - ${user.email}: ${user.leaveBalance} → ${ANNUAL_LEAVE_LIMIT} days`
      );
    });

    // Update all users at once
    const updateResult = await User.updateMany(
      { leaveBalance: { $gt: ANNUAL_LEAVE_LIMIT } },
      { $set: { leaveBalance: ANNUAL_LEAVE_LIMIT } }
    );

    console.log(`\n✅ Updated ${updateResult.modifiedCount} users`);

    // Verify the changes
    const verificationQuery = await User.find({
      leaveBalance: { $gt: ANNUAL_LEAVE_LIMIT },
    });

    if (verificationQuery.length === 0) {
      console.log("✅ Verification passed: No users exceed the limit");
    } else {
      console.log(
        `❌ Verification failed: ${verificationQuery.length} users still exceed the limit`
      );
      verificationQuery.forEach((user) => {
        console.log(`  - ${user.email}: ${user.leaveBalance} days`);
      });
    }

    // Get total user count for summary
    const totalUsers = await User.countDocuments();
    const unchangedUsers = totalUsers - updateResult.modifiedCount;

    return {
      updated: updateResult.modifiedCount,
      unchanged: unchangedUsers,
      total: totalUsers,
    };
  } catch (error) {
    console.error("❌ Error during balance normalization:", error.message);
    throw error;
  }
}

async function showSummary(stats) {
  console.log("\n" + "=".repeat(50));
  console.log("📊 BALANCE NORMALIZATION SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total Users: ${stats.total}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Unchanged: ${stats.unchanged}`);
  console.log(`Annual Leave Limit: ${ANNUAL_LEAVE_LIMIT} days`);

  if (stats.updated > 0) {
    console.log(`\n✅ Successfully normalized ${stats.updated} user(s)`);
  } else {
    console.log(`\n✅ No changes needed - all balances are within limits`);
  }

  console.log("=".repeat(50));
}

async function main() {
  console.log("🚀 Leave Balance Normalization Script");
  console.log("=".repeat(50));

  try {
    await connectDB();

    const stats = await fixLeaveBalances();
    await showSummary(stats);

    console.log("\n🎉 Script completed successfully!");
  } catch (error) {
    console.error("\n💥 Script failed:", error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { fixLeaveBalances, connectDB, disconnectDB };


