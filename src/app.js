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

// CORS configuration - Allow all origins for local testing
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for local development
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('file://')) {
      return callback(null, true);
    }
    
    // Allow all origins (for testing)
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers for maximum compatibility
app.use((req, res, next) => {
  // Set CORS headers explicitly
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

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
