require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const routes = require("./routes");
const middleware = require("./middleware");
const { rateLimiter } = require("./middleware/auth");
const UserService = require("./services/userService");
const Logger = require("./utils/logger");
const { HTTP_STATUS } = require("./utils/constants");
const { getEnv, getEnvNumber } = require("./utils/env");

const app = express();

// Initialize application
const initializeApp = async () => {
  try {
    Logger.info("App", "Initializing Ingress application...");

    // Initialize admin user
    await UserService.initializeAdmin();

    Logger.info("App", "Application initialized successfully");
  } catch (error) {
    Logger.error("App", "Failed to initialize application", error);
    process.exit(1);
  }
};

// Initialize app
initializeApp();

// Trust proxy for rate limiting and IP detection
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
  origin: getEnv("CORS_ORIGIN"),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Apply rate limiting
app.use(rateLimiter);

// Apply middleware
middleware(app);

// Health check route (no auth required)
app.get("/health", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: getEnv("API_VERSION"),
    environment: getEnv("NODE_ENV"),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    message: "Welcome to Ingress Server",
    status: "running",
    timestamp: new Date().toISOString(),
    version: getEnv("API_VERSION"),
    documentation: "/api-docs",
  });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: getEnv("API_TITLE"),
      version: getEnv("API_VERSION"),
      description: getEnv("API_DESCRIPTION"),
      contact: {
        name: "API Support",
        email: "support@consultadd.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${getEnvNumber("PORT")}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT token authentication. Get your token from POST /api/login",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Ingress API Documentation",
  })
);

// Apply routes
app.use("/api", routes);

// Error handling middleware
app.use(middleware.errorHandler);

// 404 handler (must be last)
app.use("*", middleware.notFoundHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  Logger.info("App", "SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  Logger.info("App", "SIGINT received, shutting down gracefully");
  process.exit(0);
});

module.exports = app;
