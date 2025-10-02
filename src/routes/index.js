const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const Logger = require("../utils/logger");
const { validateRequiredFields } = require("../utils/validators");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * @swagger
 * /api/track-session:
 *   post:
 *     summary: Session tracking endpoint
 *     description: Tracks and stores visitor session data including IP, duration, and page history
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "test-session-abc123xyz"
 *                 description: Unique session identifier
 *               ipAddress:
 *                 type: string
 *                 example: "203.0.113.45"
 *                 description: User's IP address
 *               pageUrl:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/home", "https://example.com/about"]
 *                 description: Page history array
 *               timezone:
 *                 type: string
 *                 example: "2 minutes"
 *                 description: Formatted session duration
 *     responses:
 *       200:
 *         description: Data stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Data stored successfully"
 *                 id:
 *                   type: string
 *                   description: Firebase document ID
 *       400:
 *         description: Missing sessionId
 *       500:
 *         description: Server error
 */
router.post("/track-session", async (req, res) => {
  try {
    const { ipAddress, sessionId, pageUrl, timezone } = req.body;

    // Log basic info only
    Logger.info("SessionTracker", "Session data received", {
      sessionId,
      ipAddress: ipAddress || "unknown"
    });

    // Simple validation - just check if we have the basic data
    if (!sessionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "sessionId is required",
      });
    }

    const clientIP = ipAddress || "unknown";

    // Parse duration (could be string or number)
    const durationMs = typeof timezone === 'number' ? timezone : parseInt(timezone) || 0;

    // Create session data object with single timestamp
    const sessionData = {
      sessionId,
      pageUrl: pageUrl || [],
      sessionDurationMs: durationMs, // Raw milliseconds value only
      timestamp: new Date().toISOString(), // Standard ISO format for easy timezone conversion
      userAgent: req.headers["user-agent"] || "unknown"
    };

    // Check if IP already exists in the database
    const existingIpQuery = await db
      .collection("session_analytics")
      .where("ipAddress", "==", clientIP)
      .limit(1)
      .get();

    if (!existingIpQuery.empty) {
      // IP exists - add new session to existing document
      const existingDoc = existingIpQuery.docs[0];
      const existingData = existingDoc.data();

      // Get existing sessions array or create new one
      const existingSessions = existingData.sessions || [];

      // Add new session to the array
      existingSessions.push(sessionData);

      // Update the document with new session
      await db.collection("session_analytics").doc(existingDoc.id).update({
        sessions: existingSessions,
        lastVisit: new Date().toISOString(), // Standard ISO format
        totalSessions: existingSessions.length,
        // Update latest session info for quick access
        latestSessionId: sessionId,
        latestPageUrl: pageUrl || [],
        latestSessionDurationMs: durationMs, // Raw milliseconds only
        updatedAt: new Date().toISOString()
      });

      Logger.info("SessionTracker", "Added new session to existing IP", {
        ipAddress: clientIP,
        docId: existingDoc.id,
        sessionCount: existingSessions.length,
        newSessionId: sessionId,
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Session added to existing IP record",
        id: existingDoc.id,
        sessionCount: existingSessions.length,
        status: "session_added"
      });
    }

    // IP doesn't exist, create new document with sessions array
    const currentTimestamp = new Date().toISOString();
    const newIpData = {
      ipAddress: clientIP,
      firstVisit: currentTimestamp, // Standard ISO format
      lastVisit: currentTimestamp,  // Standard ISO format
      totalSessions: 1,
      // Latest session info for quick access
      latestSessionId: sessionId,
      latestPageUrl: pageUrl || [],
      latestSessionDurationMs: durationMs, // Raw milliseconds only
      // All sessions stored in array
      sessions: [sessionData],
      // Metadata
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp
    };

    // Store in Firebase
    const docRef = await db.collection("session_analytics").add(newIpData);

    Logger.info("SessionTracker", "New IP record created", {
      docId: docRef.id,
      ipAddress: clientIP,
      sessionId: sessionId,
    });

    // Return success response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "New IP record created with first session",
      id: docRef.id,
      sessionCount: 1,
      status: "new_ip"
    });

  } catch (error) {
    Logger.error("SessionTracker", "Error storing data", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details || error
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to store data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Test Firebase connection endpoint
router.get("/test-firebase", async (req, res) => {
  try {
    Logger.info("FirebaseTest", "Testing Firebase connection...");
    
    // Try to write a simple test document
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Firebase connection test"
    };
    
    const docRef = await db.collection("system_health").add(testData);
    
    Logger.info("FirebaseTest", "Firebase test successful", { docId: docRef.id });
    
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Firebase connection successful",
      testDocId: docRef.id
    });
  } catch (error) {
    Logger.error("FirebaseTest", "Firebase connection failed", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Firebase connection failed",
      error: error.message
    });
  }
});

module.exports = router;
