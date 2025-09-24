require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const middleware = require("./middleware");
const UserService = require("./services/userService");

const app = express();

// Initialize admin user
UserService.initializeAdmin();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Apply middleware
middleware(app);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Ingress Server",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: process.env.API_TITLE || "Ingress API",
      version: process.env.API_VERSION || "1.0.0",
      description:
        process.env.API_DESCRIPTION ||
        "Node.js server application for IP tracking and enrichment",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Apply routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler (must be last)
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

module.exports = app;
