// Load environment configuration first
const environmentConfig = require("./src/config/environment");
const config = environmentConfig.getConfig();

// Validate environment variables before starting
const {
  validateEnvironment,
  getEnvNumber,
  getEnv,
} = require("./src/utils/env");
validateEnvironment();

const app = require("./src/app");
const Logger = require("./src/utils/logger");

const PORT = config.port;
const NODE_ENV = config.environment;

const server = app.listen(PORT, () => {
  Logger.info("Server", `🚀 Session Analytics API running on port ${PORT}`);
  Logger.info("Server", `📍 Local: http://localhost:${PORT}`);

  if (config.swaggerEnabled) {
    Logger.info(
      "Server",
      `📚 API Documentation: http://localhost:${PORT}/api-docs`
    );
  }

  Logger.info("Server", `🌍 Environment: ${NODE_ENV.toUpperCase()}`);
  Logger.info("Server", `🔒 CORS Origins: ${config.corsOrigin.join(", ")}`);
  Logger.info("Server", `📊 Debug Mode: ${config.debug ? "ON" : "OFF"}`);

  if (environmentConfig.isDevelopment()) {
    Logger.info("Server", "🔧 Development mode - detailed logging enabled");
    Logger.info("Server", "🔄 Auto-reload enabled with nodemon");
  } else {
    Logger.info("Server", "🏭 Production mode - optimized for performance");
    Logger.info("Server", "🔐 Security features enabled");
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  Logger.info("Server", `${signal} received, shutting down gracefully`);

  server.close(() => {
    Logger.info("Server", "Server closed successfully");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    Logger.error("Server", "Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("Server", "Uncaught Exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Server", "Unhandled Rejection", { reason, promise });
  process.exit(1);
});
