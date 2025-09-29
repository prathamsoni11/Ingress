const express = require("express");
const Logger = require("../utils/logger");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    Logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  Logger.error("ErrorHandler", err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: "Internal Server Error",
    message: message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  Logger.warn("NotFound", `Route not found: ${req.method} ${req.originalUrl}`);

  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Request validation middleware
 */
const validateContentType = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    if (!req.is("application/json")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Bad Request",
        message: "Content-Type must be application/json",
      });
    }
  }
  next();
};

module.exports = (app) => {
  // Request logging
  app.use(requestLogger);

  // Body parsing middleware with size limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Content type validation
  app.use(validateContentType);
};

module.exports.errorHandler = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
