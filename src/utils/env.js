/**
 * Environment Variables Validation
 * Simple environment validation for test data collection API
 */

const Logger = require("./logger");

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
  "PORT",
  "NODE_ENV",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_SERVICE_ACCOUNT_PATH",
  "JWT_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

/**
 * Validate that all required environment variables are present
 */
const validateEnvironment = () => {
  const missing = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];

    if (!value || value.trim() === "") {
      missing.push(envVar);
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
