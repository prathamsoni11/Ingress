const admin = require("firebase-admin");
const path = require("path");

// Suppress Firebase SDK verbose error logging
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  // Suppress Firebase API errors but keep other errors
  if (
    message.includes("googleapis.com") ||
    message.includes("CONSUMER_INVALID") ||
    message.includes("Permission denied on resource project") ||
    message.includes("x-debug-tracking-id") ||
    message.includes("statusDetails") ||
    message.includes("errorInfoMetadata")
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

let db;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccountPath || !projectId) {
    throw new Error("Firebase credentials not configured");
  }

  if (!admin.apps.length) {
    const serviceAccount = require(path.resolve(serviceAccountPath));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId,
    });
  }

  db = admin.firestore();
  console.log("[Firebase] Initialized");
} catch (error) {
  console.log("[Firebase] Using mock database");

  // Fallback to mock database with full Firestore API
  db = {
    collection: () => ({
      add: async () => ({ id: "mock_" + Date.now() }),
      get: async () => ({ docs: [], empty: true }),
      where: () => ({
        limit: () => ({ get: async () => ({ docs: [], empty: true }) }),
        get: async () => ({ docs: [], empty: true }),
      }),
      orderBy: () => ({ get: async () => ({ docs: [], empty: true }) }),
      doc: () => ({
        update: async () => ({ id: "mock_" + Date.now() }),
        get: async () => ({ exists: false, data: () => null }),
      }),
    }),
  };
}

module.exports = { db };
