require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const routes = require("./routes");
const middleware = require("./middleware");
const Logger = require("./utils/logger");
const { HTTP_STATUS } = require("./utils/constants");
const { getEnv, getEnvNumber } = require("./utils/env");

const app = express();

// Trust proxy for IP detection
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
  origin: "*", // Allow all origins for simple test endpoint
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// Apply middleware
middleware(app);

// Health check route
app.get("/health", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    message: "Simple Test Data Collection Server",
    status: "running",
    timestamp: new Date().toISOString(),
    documentation: "/api-docs",
  });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Simple Test API",
      version: "1.0.0",
      description: "Simple data collection API for frontend scripts",
    },
    servers: [
      {
        url: `http://localhost:${getEnvNumber("PORT")}`,
        description: "Development server",
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
    customSiteTitle: "Simple Test API Documentation",
  })
);

// Apply routes
app.use("/api", routes);

// Error handling middleware
app.use(middleware.errorHandler);

// 404 handler (must be last)
app.use("*", middleware.notFoundHandler);

module.exports = app;
