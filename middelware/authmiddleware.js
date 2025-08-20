const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verify token middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader; // Bearer TOKEN

  if (!token) return res.status(401).send("No token provided");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Invalid token");
    req.user = decoded; // { id, role, iat, exp }
    next();
  });
}

// Check if user is admin
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.send("Access denied: Admins only");
  }
  next();
}

module.exports = { verifyToken, isAdmin };
