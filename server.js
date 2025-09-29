require("dotenv").config();

// Validate environment variables before starting
const {
  validateEnvironment,
  getEnvNumber,
  getEnv,
} = require("./src/utils/env");
validateEnvironment();

const app = require("./src/app");
const Logger = require("./src/utils/logger");

const PORT = getEnvNumber("PORT");
const NODE_ENV = getEnv("NODE_ENV");

const server = app.listen(PORT, () => {
  Logger.info("Server", `🚀 Ingress server running on port ${PORT}`);
  Logger.info("Server", `📍 Local: http://localhost:${PORT}`);
  Logger.info(
    "Server",
    `📚 API Documentation: http://localhost:${PORT}/api-docs`
  );
  Logger.info("Server", `🌍 Environment: ${NODE_ENV}`);

  if (NODE_ENV === "development") {
    Logger.info("Server", "🔧 Development mode - detailed logging enabled");
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
