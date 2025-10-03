const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const {
  authenticateJWT,
  generateToken,
  requireAdmin,
  requireRole,
} = require("../middleware/auth");
const UserService = require("../services/userService");
const Logger = require("../utils/logger");
const { validateRequiredFields } = require("../utils/validators");
const {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  JWT,
  USER_ROLES,
} = require("../utils/constants");

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
 *                 description: User's IP address (required, cannot be 'unknown')
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
 *         description: Invalid request data
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
        message: "Invalid request data",
      });
    }

    const clientIP = ipAddress || "unknown";

    // Reject requests with unknown IP addresses
    if (!clientIP || clientIP === "unknown") {
      Logger.warn("SessionTracker", "Rejected request with unknown IP", {
        sessionId,
        userAgent: req.headers["user-agent"]
      });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request data",
      });
    }

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

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and get JWT token (30 days validity)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@yourdomain.com"
 *               password:
 *                 type: string
 *                 example: "Admin@123456"
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ["email", "password"]);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.message,
      });
    }

    // Authenticate user
    const authResult = await UserService.authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: authResult.message,
      });
    }

    // Generate JWT token
    const tokenPayload = {
      userId: authResult.user.id,
      email: authResult.user.email,
      role: authResult.user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = generateToken(tokenPayload, JWT.DEFAULT_EXPIRES_IN);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      token: token,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
      },
      expiresIn: JWT.DEFAULT_EXPIRES_IN,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    });
  } catch (error) {
    Logger.error("Auth", "Login error", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Authentication failed",
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     description: Create a new user account
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@yourdomain.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: "user"
 *                 description: User role (defaults to 'user')
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid data or user already exists
 *       403:
 *         description: Admin access required
 */
router.post("/users", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await UserService.createUser(
      email,
      password,
      role,
      req.user.email
    );

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: result.message,
      });
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    Logger.error("UserManagement", "Create user error", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve list of all users
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get("/users", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await UserService.getAllUsers();

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: result.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      users: result.users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    Logger.error("UserManagement", "Get users error", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Update user status (Admin only)
 *     description: Activate or deactivate a user
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       403:
 *         description: Admin access required
 */
router.patch("/users/:userId", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const result = await UserService.updateUserStatus(userId, isActive);

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: result.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    Logger.error("UserManagement", "Update user error", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Permanently delete a user
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Admin access required
 */
router.delete("/users/:userId", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await UserService.deleteUser(userId);

    if (!result.success) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: result.message,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    Logger.error("UserManagement", "Delete user error", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to delete user",
    });
  }
});

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get raw dashboard data with pagination
 *     description: Retrieve raw session analytics data from Firebase with pagination (10 records per page)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (starts from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of records per page (max 50)
 *     responses:
 *       200:
 *         description: Raw dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       firstVisit:
 *                         type: string
 *                       lastVisit:
 *                         type: string
 *                       totalSessions:
 *                         type: number
 *                       sessions:
 *                         type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *                     totalRecords:
 *                       type: number
 *                     recordsPerPage:
 *                       type: number
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       401:
 *         description: Authentication required
 */
router.get("/dashboard", authenticateJWT, requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]), async (req, res) => {
  try {
    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    // Get all data first to calculate total
    const snapshot = await db.collection("session_analytics").orderBy("lastVisit", "desc").get();
    const allRawData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply pagination
    const paginatedRawData = allRawData.slice(offset, offset + limit);

    // For normal users, remove IP addresses for privacy
    const responseData = req.user.role === USER_ROLES.ADMIN 
      ? paginatedRawData 
      : paginatedRawData.map(record => {
          const { ipAddress, ...recordWithoutIP } = record;
          return {
            ...recordWithoutIP,
            ipAddress: "***.***.***.**" // Masked IP for privacy
          };
        });

    // Calculate pagination info
    const totalRecords = allRawData.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: responseData,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        recordsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        recordsOnCurrentPage: responseData.length
      },
      message: "Raw dashboard data retrieved successfully",
      userRole: req.user.role,
      note: req.user.role === USER_ROLES.USER ? "IP addresses are masked for privacy" : "Full data access granted"
    });
  } catch (error) {
    Logger.error("Dashboard", "Error retrieving raw dashboard data", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve dashboard data",
    });
  }
});

/**
 * @swagger
 * /api/analytics/{ipAddress}:
 *   get:
 *     summary: Get analytics data for specific IP address
 *     description: Retrieve session analytics data for a specific IP address
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ipAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: IP address to get analytics for
 *         example: "203.0.113.45"
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ipAddress:
 *                       type: string
 *                     firstVisit:
 *                       type: string
 *                     lastVisit:
 *                       type: string
 *                     totalSessions:
 *                       type: number
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sessionId:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                           sessionDurationMs:
 *                             type: number
 *                           pageUrl:
 *                             type: array
 *                           userAgent:
 *                             type: string
 *       404:
 *         description: IP address not found
 *       401:
 *         description: Authentication required
 */
router.get("/analytics/:ipAddress", authenticateJWT, requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]), async (req, res) => {
  try {
    const { ipAddress } = req.params;

    // Validate IP address format (basic validation)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid IP address format",
      });
    }

    // Query Firebase for the specific IP address
    const snapshot = await db
      .collection("session_analytics")
      .where("ipAddress", "==", ipAddress)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: `No analytics data found for IP address: ${ipAddress}`,
      });
    }

    const doc = snapshot.docs[0];
    const data = {
      id: doc.id,
      ...doc.data(),
    };

    // For normal users, mask IP address for privacy (except when querying specific IP)
    const responseData = req.user.role === USER_ROLES.ADMIN 
      ? data 
      : {
          ...data,
          // Keep the queried IP visible but mask in session details if needed
          sessions: data.sessions?.map(session => ({
            ...session,
            // Keep session data but could add additional privacy controls here
          })) || []
        };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: responseData,
      message: `Analytics data retrieved for IP: ${ipAddress}`,
      userRole: req.user.role,
    });

  } catch (error) {
    Logger.error("Analytics", "Error retrieving IP analytics data", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve analytics data",
    });
  }
});

module.exports = router;
