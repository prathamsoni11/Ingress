const path = require("path");
const fs = require("fs");

/**
 * Environment Configuration Loader
 * Loads environment-specific configuration files
 */
class EnvironmentConfig {
  constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.loadEnvironmentConfig();
  }

  /**
   * Load environment-specific configuration
   */
  loadEnvironmentConfig() {
    const envFile = `.env.${this.environment}`;
    const envPath = path.resolve(process.cwd(), envFile);

    // Check if environment-specific file exists
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment config: ${envFile}`);
      require("dotenv").config({ path: envPath });
    } else {
      console.log(`Environment file ${envFile} not found, using default .env`);
      require("dotenv").config();
    }

    // Validate required environment variables
    this.validateEnvironment();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = [
      "PORT",
      "NODE_ENV",
      "FIREBASE_PROJECT_ID",
      "FIREBASE_SERVICE_ACCOUNT_PATH",
      "JWT_SECRET",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.environment === "development";
  }

  /**
   * Check if running in production
   */
  isProduction() {
    return this.environment === "production";
  }

  /**
   * Get environment-specific configuration
   */
  getConfig() {
    return {
      environment: this.environment,
      port: parseInt(process.env.PORT) || 3000,
      debug: process.env.DEBUG === "true",
      logLevel: process.env.LOG_LEVEL || "info",
      corsOrigin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : ["*"],
      swaggerEnabled: process.env.SWAGGER_ENABLED !== "false",
      database: {
        timeout: parseInt(process.env.DB_TIMEOUT) || 5000,
      },
      server: {
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
      },
      security: {
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        rateLimitMaxRequests:
          parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      },
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
      },
      admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    };
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;
