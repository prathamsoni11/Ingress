/**
 * Environment Variables Validation
 * Ensures all required environment variables are present
 */

const Logger = require("./logger");

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  "PORT",
  "NODE_ENV",
  "API_VERSION",
  "API_TITLE",
  "API_DESCRIPTION",
  "JWT_SECRET",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_SERVICE_ACCOUNT_PATH",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ALLOWED_EMAIL_DOMAIN",
  "CORS_ORIGIN",
];

/**
 * Validate that all required environment variables are present
 */
const validateEnvironment = () => {
  const missing = [];
  const invalid = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];

    if (!value || value.trim() === "") {
      missing.push(envVar);
      continue;
    }

    // Additional validation for specific variables
    switch (envVar) {
      case "PORT":
        const port = parseInt(value);
        if (isNaN(port) || port < 1 || port > 65535) {
          invalid.push(`${envVar} must be a valid port number (1-65535)`);
        }
        break;

      case "NODE_ENV":
        if (!["development", "production", "test"].includes(value)) {
          invalid.push(
            `${envVar} must be one of: development, production, test`
          );
        }
        break;

      case "JWT_SECRET":
        if (value.length < 32) {
          invalid.push(
            `${envVar} must be at least 32 characters long for security`
          );
        }
        break;

      case "ADMIN_EMAIL":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          invalid.push(`${envVar} must be a valid email address`);
        }
        break;

      case "ADMIN_PASSWORD":
        if (value.length < 8) {
          invalid.push(`${envVar} must be at least 8 characters long`);
        }
        break;
    }
  }

  if (missing.length > 0) {
    Logger.error("Environment", "Missing required environment variables", {
      missing,
    });
    console.error("\n❌ Missing required environment variables:");
    missing.forEach((envVar) => console.error(`   - ${envVar}`));
    console.error(
      "\n💡 Please check your .env file and ensure all variables are set."
    );
    console.error("📋 See .env.example for reference.\n");
    process.exit(1);
  }

  if (invalid.length > 0) {
    Logger.error("Environment", "Invalid environment variable values", {
      invalid,
    });
    console.error("\n❌ Invalid environment variable values:");
    invalid.forEach((error) => console.error(`   - ${error}`));
    console.error("\n💡 Please fix the invalid values in your .env file.\n");
    process.exit(1);
  }

  Logger.info(
    "Environment",
    "All environment variables validated successfully"
  );
};

/**
 * Get environment variable with validation
 */
const getEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
};

/**
 * Get numeric environment variable
 */
const getEnvNumber = (key) => {
  const value = getEnv(key);
  const number = parseInt(value);
  if (isNaN(number)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return number;
};

module.exports = {
  validateEnvironment,
  getEnv,
  getEnvNumber,
  REQUIRED_ENV_VARS,
};
