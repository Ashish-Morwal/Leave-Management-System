const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ANNUAL_LEAVE_LIMIT } = require("../utils/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Employee"], required: true },
    joiningDate: {
      type: Date,
      required: function () {
        return this.role === "Employee";
      },
    },
    leaveBalance: {
      type: Number,
      default: ANNUAL_LEAVE_LIMIT,
      validate: {
        validator: function (value) {
          return value >= 0 && value <= ANNUAL_LEAVE_LIMIT;
        },
        message: `Leave balance must be between 0 and ${ANNUAL_LEAVE_LIMIT} days`,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Clamp leaveBalance to valid range before save
userSchema.pre("save", function (next) {
  // Always ensure leaveBalance is within valid range
  if (this.leaveBalance > ANNUAL_LEAVE_LIMIT) {
    this.leaveBalance = ANNUAL_LEAVE_LIMIT;
  } else if (this.leaveBalance < 0) {
    this.leaveBalance = 0;
  }
  next();
});

// Hash password before save if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Skip if already a bcrypt hash (avoids double-hashing from older code/seeders)
  const alreadyHashed =
    typeof this.password === "string" &&
    /^\$2[aby]?\$\d+\$/.test(this.password);
  if (alreadyHashed) return next();
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
