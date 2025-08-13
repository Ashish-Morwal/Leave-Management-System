// Backward-compatible single-role middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: `Access denied. ${role} role required` });
    }
    next();
  };
};

// New: multiple allowed roles
const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const role = req.user.role;
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return res
        .status(500)
        .json({ message: "Server misconfiguration: allowed roles not set" });
    }
    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient role" });
    }
    next();
  };
};

module.exports = { requireRole, requireRoles };
