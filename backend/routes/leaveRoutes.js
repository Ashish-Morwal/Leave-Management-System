const express = require("express");
const {
  listLeaves,
  applyLeave,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
  cancelLeave,
  verifyLeaveBalance,
} = require("../controllers/leaveController");
const verifyToken = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// List leaves (auth required, admins can see all)
router.get("/", verifyToken, listLeaves);

router.post("/", verifyToken, applyLeave);
router.patch("/:id/approve", verifyToken, requireRole("Admin"), approveLeave);
router.patch("/:id/reject", verifyToken, requireRole("Admin"), rejectLeave);
router.patch("/:id/cancel", verifyToken, cancelLeave); // Employee or Admin can cancel
router.get("/balance/:employeeId", verifyToken, getLeaveBalance);
router.get(
  "/verify-balance/:employeeId",
  verifyToken,
  requireRole("Admin"),
  verifyLeaveBalance
);

module.exports = router;
