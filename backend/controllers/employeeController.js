const bcrypt = require("bcrypt");
const User = require("../models/User");
const { ANNUAL_LEAVE_LIMIT } = require("../utils/constants");

const addEmployee = async (req, res) => {
  try {
    const { name, email, password, joiningDate } = req.body;

    // Completely ignore any leaveBalance sent by client
    // Always use ANNUAL_LEAVE_LIMIT from User model default
    if (!name || !email || !password || !joiningDate) {
      return res.status(400).json({
        message: "Please provide name, email, password, and joiningDate",
      });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const employee = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "Employee",
      joiningDate,
      // leaveBalance automatically set to ANNUAL_LEAVE_LIMIT by User model
      // Client has no control over this value
    });
    const employeeResponse = {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      joiningDate: employee.joiningDate,
      leaveBalance: employee.leaveBalance,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
    res.status(201).json({
      message: "Employee added successfully",
      employee: employeeResponse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while adding employee",
      error: error.message,
    });
  }
};

const getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const searchFilter = search
      ? {
          role: "Employee",
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : { role: "Employee" };
    const employees = await User.find(searchFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalEmployees = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalEmployees / limit);
    res.status(200).json({
      message: "Employees retrieved successfully",
      employees,
      pagination: {
        currentPage: page,
        totalPages,
        totalEmployees,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while retrieving employees",
      error: error.message,
    });
  }
};

module.exports = { addEmployee, getEmployees };
