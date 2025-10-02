#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates environment configuration for different environments
 */

const fs = require("fs");
const path = require("path");

const environments = ["development", "production"];

console.log("🔍 Validating environment configurations...\n");

environments.forEach((env) => {
  console.log(`📋 Checking ${env.toUpperCase()} environment:`);

  const envFile = `.env.${env}`;
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    console.log(`  ❌ ${envFile} not found`);
    return;
  }

  console.log(`  ✅ ${envFile} exists`);

  // Load and validate environment
  try {
    // Temporarily set NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = env;

    // Clear require cache
    delete require.cache[require.resolve("../src/config/environment")];

    // Load environment config
    const environmentConfig = require("../src/config/environment");
    const config = environmentConfig.getConfig();

    console.log(`  ✅ Configuration loaded successfully`);
    console.log(`  📊 Port: ${config.port}`);
    console.log(`  🔒 CORS Origins: ${config.corsOrigin.join(", ")}`);
    console.log(
      `  📚 Swagger: ${config.swaggerEnabled ? "Enabled" : "Disabled"}`
    );
    console.log(
      `  🔐 JWT Secret: ${config.jwt.secret ? "***configured***" : "MISSING"}`
    );
    console.log(`  👤 Admin Email: ${config.admin.email}`);

    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  } catch (error) {
    console.log(`  ❌ Configuration error: ${error.message}`);
  }

  console.log("");
});

console.log("✅ Environment validation complete!");
