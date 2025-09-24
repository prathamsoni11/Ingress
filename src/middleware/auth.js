const jwt = require("jsonwebtoken");

// Removed API Key Authentication - Now using JWT only

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Access token is required. Provide it as: Authorization: Bearer <token>",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired. Please get a new token.",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Invalid token provided.",
      });
    } else {
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Error verifying token.",
      });
    }
  }
};

// Generate JWT Token (helper function)
const generateToken = (payload, expiresIn = "30d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Admin Role Check Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
    });
  }

  next();
};

module.exports = {
  authenticateJWT,
  generateToken,
  requireAdmin,
};
