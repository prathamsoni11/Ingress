// Load environment configuration first
const environmentConfig = require("./config/environment");
const config = environmentConfig.getConfig();

const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const routes = require("./routes");
const middleware = require("./middleware");
const UserService = require("./services/userService");
const Logger = require("./utils/logger");
const { HTTP_STATUS } = require("./utils/constants");
const { getEnv, getEnvNumber } = require("./utils/env");

const app = express();

// Initialize application
const initializeApp = async () => {
  try {
    Logger.info("App", "Initializing application...");

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

// Trust proxy for IP detection
app.set("trust proxy", 1);

// Environment-specific CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.environment === 'development') {
      // Development: Allow localhost and file origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('file://')) {
        return callback(null, true);
      }
      // Also allow configured development origins
      if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
        return callback(null, true);
      }
    } else {
      // Production: Only allow configured origins
      if (config.corsOrigin.includes('*') || config.corsOrigin.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // Reject origin
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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

// Environment-specific Swagger configuration
if (config.swaggerEnabled) {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Session Analytics API",
        version: "2.0.0",
        description: `Complete session analytics API with user management and JWT authentication - ${config.environment.toUpperCase()} Environment`,
      },
      servers: [
        {
          url: config.environment === 'production' 
            ? `https://yourdomain.com` 
            : `http://localhost:${config.port}`,
          description: `${config.environment.charAt(0).toUpperCase() + config.environment.slice(1)} server`,
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token for authentication (30 days validity)",
          },
        },
      },
    },
    apis: ["./src/routes/*.js"],
  };

  const specs = swaggerJsdoc(swaggerOptions);
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: `Session Analytics API Documentation - ${config.environment.toUpperCase()}`,
    })
  );

  Logger.info("App", `Swagger documentation enabled at /api-docs (${config.environment})`);
} else {
  Logger.info("App", "Swagger documentation disabled in production");
}

// Apply routes
app.use("/api", routes);

// Error handling middleware
app.use(middleware.errorHandler);

// 404 handler (must be last)
app.use("*", middleware.notFoundHandler);

module.exports = app;
