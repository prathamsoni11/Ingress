const jwt = require("jsonwebtoken");
const Logger = require("../utils/logger");
const { HTTP_STATUS, USER_ROLES } = require("../utils/constants");

/**
 * JWT Authentication Middleware
 * Validates JWT tokens and adds user info to request
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    Logger.warn("Auth", "Missing JWT token", {
      url: req.originalUrl,
      method: req.method,
    });

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    Logger.debug("Auth", "JWT token validated", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    Logger.warn("Auth", "JWT token validation failed", {
      error: error.message,
      url: req.originalUrl,
    });

    if (error.name === "TokenExpiredError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Token has expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token",
      });
    } else {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Token verification failed",
      });
    }
  }
};

/**
 * Generate JWT Token
 */
const generateToken = (payload, expiresIn = "30d") => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      algorithm: "HS256",
    });

    Logger.info("Auth", "JWT token generated", {
      userId: payload.userId,
      role: payload.role,
      expiresIn,
    });

    return token;
  } catch (error) {
    Logger.error("Auth", "Failed to generate JWT token", error);
    throw new Error("Token generation failed");
  }
};

/**
 * Admin Role Check Middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    Logger.warn("Auth", "Admin access denied", {
      userId: req.user.userId,
      role: req.user.role,
    });

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

/**
 * Role-based Access Control Middleware
 */
const requireRole = (allowedRoles = [USER_ROLES.USER, USER_ROLES.ADMIN]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      Logger.warn("Auth", "Role access denied", {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  generateToken,
  requireAdmin,
  requireRole,
};
