const jwt = require("jsonwebtoken");
const Logger = require("../utils/logger");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  JWT,
  USER_ROLES,
} = require("../utils/constants");

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
      error: "Unauthorized",
      message:
        "Access token is required. Provide it as: Authorization: Bearer <token>",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    Logger.debug("Auth", "JWT token validated", {
      userId: decoded.userId,
      email: decoded.email,
    });

    next();
  } catch (error) {
    Logger.warn("Auth", "JWT token validation failed", {
      error: error.message,
      url: req.originalUrl,
    });

    if (error.name === "TokenExpiredError") {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "Unauthorized",
        message: "Token has expired. Please get a new token.",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: "Forbidden",
        message: "Invalid token provided.",
      });
    } else {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Internal Server Error",
        message: "Error verifying token.",
      });
    }
  }
};

/**
 * Generate JWT Token
 * Creates a new JWT token with specified payload and expiration
 */
const generateToken = (payload, expiresIn = JWT.DEFAULT_EXPIRES_IN) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      algorithm: JWT.ALGORITHM,
    });

    Logger.info("Auth", "JWT token generated", {
      userId: payload.userId,
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
 * Ensures user has admin privileges
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    Logger.warn("Auth", "Admin check failed - no user in request");

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: "Unauthorized",
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }

  if (req.user.role !== USER_ROLES.ADMIN) {
    Logger.warn("Auth", "Admin access denied", {
      userId: req.user.userId,
      role: req.user.role,
    });

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      error: "Forbidden",
      message: "Admin access required",
    });
  }

  Logger.debug("Auth", "Admin access granted", {
    userId: req.user.userId,
  });

  next();
};

/**
 * Role-based Access Control Middleware
 * Automatically grants access based on JWT role
 */
const requireRole = (allowedRoles = [USER_ROLES.USER, USER_ROLES.ADMIN]) => {
  return (req, res, next) => {
    if (!req.user) {
      Logger.warn("Auth", "Role check failed - no user in request");

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "Unauthorized",
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      Logger.warn("Auth", "Role access denied", {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
      });

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: "Forbidden",
        message: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    Logger.debug("Auth", "Role access granted", {
      userId: req.user.userId,
      role: req.user.role,
    });

    next();
  };
};

/**
 * Rate limiting middleware (environment-aware)
 */
const rateLimiter = (() => {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return (req, res, next) => next();
  }

  const requests = new Map();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100;

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(clientId)) {
      requests.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    const clientData = requests.get(clientId);

    if (now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    if (clientData.count >= MAX_REQUESTS) {
      Logger.warn("RateLimit", "Rate limit exceeded", { clientId });

      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }

    clientData.count++;
    next();
  };
})();

module.exports = {
  authenticateJWT,
  generateToken,
  requireAdmin,
  requireRole,
  rateLimiter,
};
