const express = require("express");
const {
  addEmployee,
  getEmployees,
} = require("../controllers/employeeController");
const verifyToken = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", verifyToken, requireRoles(["Admin"]), addEmployee);
router.get("/", verifyToken, requireRoles(["Admin"]), getEmployees);

module.exports = router;
