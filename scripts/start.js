#!/usr/bin/env node

/**
 * Environment-aware startup script
 * Usage:
 *   npm run dev (development)
 *   npm run start (production)
 *   NODE_ENV=production node scripts/start.js
 */

const path = require("path");
const { spawn } = require("child_process");

// Determine environment
const environment = process.env.NODE_ENV || "development";
const isDevelopment = environment === "development";

console.log(`🚀 Starting application in ${environment.toUpperCase()} mode...`);

// Set environment-specific configurations
process.env.NODE_ENV = environment;

// Start the application
const serverPath = path.join(__dirname, "..", "server.js");

const serverProcess = spawn("node", [serverPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: environment,
    // Add any environment-specific variables here
  },
});

// Handle process events
serverProcess.on("error", (error) => {
  console.error(`❌ Failed to start server: ${error.message}`);
  process.exit(1);
});

serverProcess.on("exit", (code, signal) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code} and signal ${signal}`);
    process.exit(code);
  }
  console.log("✅ Server stopped gracefully");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  serverProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  serverProcess.kill("SIGTERM");
});
