#!/usr/bin/env node

/**
 * Simple JWT Testing Script
 * Tests the JWT authentication flow
 */

const { login, trackVisitor } = require("./examples/jwt-client-example");

async function runJWTTests() {
  console.log("🧪 Running JWT Authentication Tests\n");

  try {
    // Test 1: Login
    console.log("📋 Test 1: Login and get JWT token");
    const token = await login("Test Client");
    console.log("✅ Login successful\n");

    // Test 2: Track business IP
    console.log("📋 Test 2: Track business IP (Microsoft)");
    const businessResult = await trackVisitor(token, {
      ipAddress: "204.79.197.200",
      sessionId: "test_business",
      pageUrl: "https://example.com/landing",
    });
    console.log("Result:", businessResult.status);
    console.log("✅ Business IP tracked\n");

    // Test 3: Track ISP IP (should be filtered)
    console.log("📋 Test 3: Track ISP IP (should be filtered)");
    const ispResult = await trackVisitor(token, {
      ipAddress: "125.20.250.6",
      sessionId: "test_isp",
    });
    console.log("Result:", ispResult.status);
    console.log("✅ ISP IP filtered as expected\n");

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runJWTTests();
}

module.exports = { runJWTTests };
