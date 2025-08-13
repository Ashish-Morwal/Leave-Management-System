const mongoose = require("mongoose");
const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const {
  getInclusiveDayCount,
  isValidDateString,
  parseDateFromYYYYMMDD,
} = require("../utils/dateUtils");
const { ANNUAL_LEAVE_LIMIT } = require("../utils/constants");

// ---------------- List Leaves ----------------
const listLeaves = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const employeeIdParam = req.query.employeeId;

    const filter = {};

    if (req.user?.role !== "Admin") {
      filter.employeeId = req.user._id;
    } else if (
      employeeIdParam &&
      mongoose.Types.ObjectId.isValid(employeeIdParam)
    ) {
      filter.employeeId = employeeIdParam;
    }

    if (status)
      filter.status =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const query = LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employeeId", "name email");

    const [rawLeaves, total] = await Promise.all([
      query,
      LeaveRequest.countDocuments(filter),
    ]);

    const leaves = rawLeaves.map((doc) => {
      const obj = doc.toObject({ getters: true });
      const employee =
        doc.employeeId && typeof doc.employeeId === "object"
          ? {
              _id: doc.employeeId._id,
              name: doc.employeeId.name,
              email: doc.employeeId.email,
            }
          : undefined;
      return {
        ...obj,
        employee,
        employeeName: employee?.name,
        status:
          obj.status.charAt(0).toUpperCase() +
          obj.status.slice(1).toLowerCase(),
      };
    });

    res.status(200).json({
      message: "Leaves retrieved successfully",
      leaves,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        limit,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in listLeaves:", error.message);
    res.status(500).json({
      message: "Server error while retrieving leaves",
      error: error.message,
    });
  }
};

// ---------------- Apply Leave ----------------
const applyLeave = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reason,
      employeeId: selectedEmployeeId,
    } = req.body;
    const requestingUser = req.user;

    let targetEmployeeId = requestingUser._id;
    let targetEmployee;

    if (requestingUser.role === "Admin" && selectedEmployeeId) {
      targetEmployeeId = selectedEmployeeId;
      targetEmployee = await User.findById(targetEmployeeId);
      if (!targetEmployee)
        return res.status(404).json({ message: "Selected employee not found" });
      if (targetEmployee.role !== "Employee")
        return res
          .status(400)
          .json({ message: "Can only apply leave for employees" });
    } else {
      targetEmployee = await User.findById(targetEmployeeId);
      if (!targetEmployee)
        return res.status(404).json({ message: "Employee not found" });
    }

    if (!reason || reason.trim() === "")
      return res.status(400).json({ message: "Reason for leave is required" });

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });

    if (!isValidDateString(startDate) || !isValidDateString(endDate))
      return res
        .status(400)
        .json({ message: "Invalid date format. Use YYYY-MM-DD" });

    const startDateObj = parseDateFromYYYYMMDD(startDate);
    const endDateObj = parseDateFromYYYYMMDD(endDate);

    if (endDateObj < startDateObj)
      return res
        .status(400)
        .json({ message: "End date cannot be before start date" });

    const joiningDate = new Date(targetEmployee.joiningDate);
    if (startDateObj < joiningDate)
      return res
        .status(400)
        .json({ message: "Leave start date cannot be before joining date" });

    const daysRequested = getInclusiveDayCount(startDate, endDate);
    if (daysRequested < 1)
      return res.status(400).json({ message: "Leave must be at least 1 day" });

    if (targetEmployee.leaveBalance <= 0)
      return res.status(400).json({ message: "No available leave balance" });

    const pendingLeaves = await LeaveRequest.find({
      employeeId: targetEmployeeId,
      status: "Pending",
    });
    const pendingDays = pendingLeaves.reduce(
      (sum, leave) => sum + leave.daysRequested,
      0
    );
    const availableBalance = targetEmployee.leaveBalance - pendingDays;

    if (availableBalance <= 0)
      return res
        .status(400)
        .json({ message: "All leave balance is in pending requests" });

    if (daysRequested > availableBalance)
      return res.status(400).json({
        message: `Insufficient leave balance. Available: ${availableBalance}, Requested: ${daysRequested}`,
      });

    const overlappingLeaves = await LeaveRequest.find({
      employeeId: targetEmployeeId,
      status: { $in: ["Pending", "Approved"] },
      $and: [
        { startDate: { $lte: endDateObj } },
        { endDate: { $gte: startDateObj } },
      ],
    });

    if (overlappingLeaves.length > 0)
      return res.status(400).json({ message: "Overlapping leave exists." });

    const leaveRequest = await LeaveRequest.create({
      employeeId: targetEmployeeId,
      startDate: startDateObj,
      endDate: endDateObj,
      daysRequested,
      reason: reason.trim(),
      status: "Pending",
    });

    await leaveRequest.populate("employeeId", "name email");

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({
      message: "Server error while applying leave",
      error: error.message,
    });
  }
};

// ---------------- Approve Leave ----------------
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;

    const leaveRequest = await LeaveRequest.findById(id).populate("employeeId");

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });
    if (leaveRequest.status !== "Pending")
      return res
        .status(400)
        .json({ message: `Leave already ${leaveRequest.status}` });

    const employee = leaveRequest.employeeId;
    if (employee.leaveBalance < leaveRequest.daysRequested)
      return res.status(400).json({
        message: `Insufficient balance. Available: ${employee.leaveBalance}, Required: ${leaveRequest.daysRequested}`,
      });

    // Calculate new balance
    const newBalance = employee.leaveBalance - leaveRequest.daysRequested;

    // Update employee's leave balance
    const updatedEmployee = await User.findByIdAndUpdate(
      employee._id,
      { leaveBalance: newBalance },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      throw new Error("Failed to update employee leave balance");
    }

    // Update leave request status
    leaveRequest.status = "Approved";
    leaveRequest.decisionAt = new Date();
    leaveRequest.reviewerId = reviewerId;
    await leaveRequest.save();

    await leaveRequest.populate("reviewerId", "name email");

    res.status(200).json({
      message: "Leave approved successfully",
      leaveRequest,
      newBalance: updatedEmployee.leaveBalance,
    });
  } catch (error) {
    console.error("Error approving leave:", error.message);
    res.status(500).json({
      message: "Server error while approving leave",
      error: error.message,
    });
  }
};

// ---------------- Reject Leave ----------------
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const reviewerId = req.user._id;

    const leaveRequest = await LeaveRequest.findById(id).populate("employeeId");

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });
    if (leaveRequest.status !== "Pending")
      return res
        .status(400)
        .json({ message: `Leave already ${leaveRequest.status}` });

    leaveRequest.status = "Rejected";
    leaveRequest.decisionAt = new Date();
    leaveRequest.reviewerId = reviewerId;
    await leaveRequest.save();

    await leaveRequest.populate("reviewerId", "name email");

    res
      .status(200)
      .json({ message: "Leave rejected successfully", leaveRequest });
  } catch (error) {
    console.error("Error rejecting leave:", error.message);
    res.status(500).json({
      message: "Server error while rejecting leave",
      error: error.message,
    });
  }
};

// ---------------- Get Leave Balance ----------------
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const requestingUser = req.user;

    if (
      requestingUser.role !== "Admin" &&
      requestingUser._id.toString() !== employeeId
    )
      return res.status(403).json({ message: "Access denied" });

    const employee = await User.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const approvedLeaves = await LeaveRequest.find({
      employeeId,
      status: "Approved",
    });
    const totalTaken = approvedLeaves.reduce(
      (sum, leave) => sum + leave.daysRequested,
      0
    );

    const pendingRequests = await LeaveRequest.find({
      employeeId,
      status: "Pending",
    }).sort({ appliedAt: -1 });
    const totalPending = pendingRequests.reduce(
      (sum, leave) => sum + leave.daysRequested,
      0
    );

    res.status(200).json({
      message: "Leave balance retrieved successfully",
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
      },
      leaveBalance: {
        available: employee.leaveBalance,
        totalTaken,
        totalPending,
        pendingRequests,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while retrieving leave balance",
      error: error.message,
    });
  }
};

// ---------------- Cancel Leave ----------------
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;
    const leaveRequest = await LeaveRequest.findById(id).populate("employeeId");

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });

    if (
      requestingUser.role !== "Admin" &&
      requestingUser._id.toString() !== leaveRequest.employeeId._id.toString()
    )
      return res.status(403).json({ message: "Access denied" });

    if (leaveRequest.status !== "Approved")
      return res.status(400).json({
        message: `Cannot cancel leave. Status: ${leaveRequest.status}`,
      });

    const today = new Date();
    if (new Date(leaveRequest.startDate) <= today)
      return res.status(400).json({
        message: "Cannot cancel leave that has started or in progress",
      });

    const employee = await User.findById(leaveRequest.employeeId._id);
    const newBalance = Math.min(
      employee.leaveBalance + leaveRequest.daysRequested,
      ANNUAL_LEAVE_LIMIT
    );
    await User.findByIdAndUpdate(employee._id, { leaveBalance: newBalance });

    leaveRequest.status = "Cancelled";
    leaveRequest.cancelledAt = new Date();
    leaveRequest.cancelledBy = requestingUser._id;
    await leaveRequest.save();
    await leaveRequest.populate("cancelledBy", "name email");

    res.status(200).json({
      message: "Leave cancelled successfully",
      leaveRequest,
      newBalance,
    });
  } catch (error) {
    console.error("Cancel leave error:", error);
    res.status(500).json({
      message: "Server error while cancelling leave",
      error: error.message,
    });
  }
};

// ---------------- Verify Leave Balance ----------------
const verifyLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Only admins can verify balances
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get all approved leaves for this employee
    const approvedLeaves = await LeaveRequest.find({
      employeeId,
      status: "Approved",
    });

    // Calculate total days taken
    const totalDaysTaken = approvedLeaves.reduce(
      (sum, leave) => sum + leave.daysRequested,
      0
    );

    // Calculate what the balance should be
    const { ANNUAL_LEAVE_LIMIT } = require("../utils/constants");
    const expectedBalance = ANNUAL_LEAVE_LIMIT - totalDaysTaken;
    const currentBalance = employee.leaveBalance;
    const difference = expectedBalance - currentBalance;

    // If there's a discrepancy, fix it
    if (difference !== 0) {
      await User.findByIdAndUpdate(employeeId, {
        leaveBalance: expectedBalance,
      });
    }

    res.status(200).json({
      message: "Leave balance verified",
      employee: {
        name: employee.name,
        email: employee.email,
        oldBalance: currentBalance,
        newBalance: expectedBalance,
        corrected: difference !== 0,
      },
      leaves: {
        totalApproved: approvedLeaves.length,
        totalDaysTaken: totalDaysTaken,
        expectedBalance: expectedBalance,
      },
    });
  } catch (error) {
    console.error("Error verifying leave balance:", error.message);
    res.status(500).json({
      message: "Server error while verifying leave balance",
      error: error.message,
    });
  }
};

module.exports = {
  listLeaves,
  applyLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  cancelLeave,
  verifyLeaveBalance,
};
