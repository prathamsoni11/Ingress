const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const Logger = require("../utils/logger");
const { validateRequiredFields } = require("../utils/validators");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * @swagger
 * /api/simple-test:
 *   post:
 *     summary: Simple data collection endpoint
 *     description: Stores visitor data from frontend script (no authentication required)
 *     tags: [Testing]
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
router.post("/simple-test", async (req, res) => {
  try {
    const { ipAddress, sessionId, pageUrl, timezone } = req.body;

    // Simple validation - just check if we have the basic data
    if (!sessionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "sessionId is required",
      });
    }

    // Create the data object exactly as received from frontend
    const testData = {
      ipAddress: ipAddress || "unknown",
      sessionId,
      pageUrl: pageUrl || [],
      sessionDuration: timezone || "0 seconds",
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "unknown",
      createdAt: new Date().toISOString(),
    };

    // Store in Firebase
    const docRef = await db.collection("simple_test_data").add(testData);

    Logger.info("SimpleTest", "Data stored successfully", {
      docId: docRef.id,
      ipAddress: testData.ipAddress,
      sessionId: testData.sessionId,
    });

    // Return simple success response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Data stored successfully",
      id: docRef.id,
    });
  } catch (error) {
    Logger.error("SimpleTest", "Error storing data", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to store data",
    });
  }
});

module.exports = router;
