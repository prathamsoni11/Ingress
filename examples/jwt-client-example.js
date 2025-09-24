// Use built-in fetch (Node.js 18+) or install node-fetch for older versions
const fetch = globalThis.fetch || require("node-fetch");

const BASE_URL = "http://localhost:3000";

/**
 * Step 1: Login and get JWT token
 */
async function login(
  email = "admin@consultadd.com",
  password = "Admin@123456"
) {
  console.log("🔐 Logging in to get JWT token...");

  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log("✅ Login successful!");
    console.log("User:", result.user);
    console.log("Token:", result.token);
    console.log("Expires in:", result.expiresIn);
    return { token: result.token, user: result.user };
  } else {
    throw new Error("Login failed: " + result.message);
  }
}

/**
 * Step 2: Use JWT token to track visitor
 */
async function trackVisitor(token, visitorData) {
  console.log("\n📊 Tracking visitor with JWT token...");

  const response = await fetch(`${BASE_URL}/api/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(visitorData),
  });

  const result = await response.json();
  console.log("Result:", result);
  return result;
}

/**
 * Step 3: Get all visitors
 */
/**
 * Step 3: Get dashboard summary
 */
async function getDashboardSummary(token) {
  console.log("\n📊 Getting dashboard summary...");

  const response = await fetch(`${BASE_URL}/api/dashboard-summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  console.log("Dashboard Summary:", result);
  return result;
}

/**
 * Step 4: Get all visitors (admin only - requires JWT token)
 */
async function getVisitors(token) {
  console.log("\n📋 Getting all visitors (admin only)...");

  const response = await fetch(`${BASE_URL}/api/visitors`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  console.log("Visitors:", result);
  return result;
}

/**
 * Complete example workflow
 */
async function main() {
  try {
    console.log("🚀 JWT Authentication Example\n");

    // Step 1: Login
    const loginResult = await login();
    const token = loginResult.token;

    // Step 2: Track some visitors
    const visitors = [
      {
        ipAddress: "204.79.197.200",
        sessionId: "session_microsoft",
        pageUrl: "https://example.com/landing",
        timestamp: new Date().toISOString(),
      },
      {
        ipAddress: "125.20.250.6", // This will be filtered (ISP)
        sessionId: "session_isp",
        pageUrl: "https://example.com/about",
      },
    ];

    for (const visitor of visitors) {
      await trackVisitor(token, visitor);
    }

    // Step 3: Test enrichment domains
    console.log("\n🔍 Getting available enrichment domains...");
    const domainsResponse = await fetch(`${BASE_URL}/api/enrichment-domains`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const domainsData = await domainsResponse.json();
    console.log("Available domains:", domainsData.domains);

    // Step 3.5: Test company profile lookup
    if (domainsData.domains && domainsData.domains.length > 0) {
      const testDomain = domainsData.domains[0]; // Use first available domain
      console.log(`\n🏢 Getting company profile for ${testDomain}...`);
      const companyResponse = await fetch(
        `${BASE_URL}/api/company/${testDomain}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const companyData = await companyResponse.json();
      console.log("Company profile:", companyData.data);
    }

    // Step 4: Get dashboard summary
    await getDashboardSummary(token);

    // Step 5: Get all visitors (admin only - using JWT token)
    await getVisitors(token);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  login,
  trackVisitor,
  getDashboardSummary,
  getVisitors,
};
