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
  console.error("[Firebase] Error initializing:", error.message);
  console.error(
    "[Firebase] Service Account Path:",
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  );
  console.error("[Firebase] Project ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("[Firebase] Falling back to mock database for development");

  // Fallback to mock database with full Firestore API
  db = {
    collection: (name) => ({
      add: async (data) => {
        console.log(
          `[Mock DB] Adding to ${name}:`,
          JSON.stringify(data, null, 2)
        );
        return { id: "mock_" + Date.now() };
      },
      get: async () => ({
        docs: [],
        empty: true,
      }),
      where: (field, operator, value) => ({
        limit: (num) => ({
          get: async () => ({
            docs: [],
            empty: true,
          }),
        }),
        get: async () => ({
          docs: [],
          empty: true,
        }),
      }),
      orderBy: (field, direction) => ({
        get: async () => ({
          docs: [],
          empty: true,
        }),
      }),
      doc: (id) => ({
        update: async (data) => {
          console.log(
            `[Mock DB] Updating ${name}/${id}:`,
            JSON.stringify(data, null, 2)
          );
          return { id: id };
        },
        get: async () => ({
          exists: false,
          data: () => null,
        }),
      }),
    }),
  };
}

module.exports = { db };
