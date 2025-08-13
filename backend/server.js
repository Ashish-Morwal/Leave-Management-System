// Load environment variables
require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");

// Set defaults if env variables are missing
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/leave-management";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Initialize Express
const app = express();
const PORT = parseInt(process.env.PORT) || 5000;

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// CORS configuration for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Development origins
    const allowedOrigins = [
      "http://localhost:3000", // React default
      "http://localhost:5173", // Vite default
      "http://localhost:3001", // Alternative React port
      "http://localhost:8080",
      "https://leave-management-system-frontand.onrender.com"// 
    ];

    // Production origin from environment variable
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/users", userRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Leave Management API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint for deployment platforms
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "Leave Management API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${process.env.MONGO_URI}`);
  console.log(
    `CORS Origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`
  );
});

// Handle server startup errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please free the port or use a different one.`
    );
    process.exit(1);
  } else {
    console.error("Server error:", error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
