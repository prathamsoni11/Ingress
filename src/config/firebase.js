const admin = require("firebase-admin");
const path = require("path");

let db;

try {
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountPath && projectId) {
      // Initialize with service account key
      const serviceAccount = require(path.resolve(serviceAccountPath));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });

      db = admin.firestore();
      console.log("[Firebase] Successfully initialized with service account");
    } else {
      throw new Error("Firebase credentials not found");
    }
  } else {
    db = admin.firestore();
  }
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
