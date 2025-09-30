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
const IPEnrichmentService = require("../services/ipEnrichmentService");
const CompanyEnrichmentService = require("../services/companyEnrichmentService");
const cacheService = require("../services/cacheService");
const Logger = require("../utils/logger");
const {
  validateRequiredFields,
  validateIPAddress,
} = require("../utils/validators");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  JWT,
  USER_ROLES,
} = require("../utils/constants");

/**
 * ROLE-BASED ACCESS CONTROL SYSTEM
 *
 * Authentication Levels:
 * 1. No Auth Required: /health, /, /api-docs, POST /api/login
 * 2. User + Admin Access: /api/track, /api/dashboard-summary, /api/company/*, /api/enrichment-domains
 * 3. Admin Only Access: /api/visitors, /api/users/*, /api/cache/*
 *
 * JWT Token contains: { userId, email, role, iat }
 * Roles: "user" | "admin"
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the server
 *     tags: [Health]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - Token missing or expired
 *       403:
 *         description: Forbidden - Invalid token
 */
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login and get JWT token
 *     description: Authenticate with email/password and receive a JWT token for BearerAuth
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
 *                 format: email
 *                 example: "admin@consultadd.com"
 *                 description: User email (must be @consultadd.com domain)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin@123456"
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn:
 *                   type: string
 *                   example: "30d"
 *       400:
 *         description: Bad request - missing email or password
 *       401:
 *         description: Invalid credentials or account deactivated
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ["email", "password"]);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: "Bad Request",
        message: validation.message,
      });
    }

    Logger.info("Auth", "Login attempt", { email });

    const authResult = await UserService.authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: "Unauthorized",
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

    Logger.info("Auth", "Login successful", {
      userId: authResult.user.id,
      email: authResult.user.email,
    });

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
      error: "Internal Server Error",
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    });
  }
});

// Removed redundant /api/health - use /health instead

/**
 * @swagger
 * /api/track:
 *   post:
 *     summary: Track website visitor data
 *     description: Receives visitor data and performs IP lookup and enrichment
 *     tags: [Tracking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *               - sessionId
 *               - pageUrl
 *               - timestamp
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 example: "204.79.197.200"
 *                 description: Visitor's IP address
 *               sessionId:
 *                 type: string
 *                 example: "abc123xyz"
 *                 description: Unique session identifier
 *               pageUrl:
 *                 type: string
 *                 example: "https://example.com/page"
 *                 description: URL of the visited page
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T12:00:00.000Z"
 *                 description: Timestamp of the visit
 *     responses:
 *       200:
 *         description: Data processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     data:
 *                       type: object
 *                       properties:
 *                         ip:
 *                           type: string
 *                         asn:
 *                           type: string
 *                         as_name:
 *                           type: string
 *                         as_domain:
 *                           type: string
 *                         type:
 *                           type: string
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "filtered"
 *                     reason:
 *                       type: string
 *                       example: "ISP or Hosting"
 *       401:
 *         description: Unauthorized - Token missing or expired
 *       403:
 *         description: Forbidden - Invalid token
 */
router.post(
  "/track",
  authenticateJWT,
  requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]),
  async (req, res) => {
    try {
      const { ipAddress, sessionId, pageUrl, timestamp } = req.body;

      // Validate required fields
      const validation = validateRequiredFields(req.body, ["ipAddress"]);
      if (!validation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Bad Request",
          message: validation.message,
        });
      }

      // Validate IP address format
      const ipValidation = validateIPAddress(ipAddress);
      if (!ipValidation.isValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Bad Request",
          message: ipValidation.message,
        });
      }

      Logger.info("Tracking", "New website visit received", {
        ipAddress,
        sessionId,
        pageUrl,
        timestamp,
        userId: req.user.userId,
      });

      // Perform IP enrichment
      const enrichmentResult = await IPEnrichmentService.enrichIP(ipAddress);

      // Return early if IP was filtered
      if (enrichmentResult.status === "filtered") {
        Logger.info("Tracking", "IP filtered", {
          ipAddress,
          reason: enrichmentResult.reason,
        });
        return res.status(HTTP_STATUS.OK).json(enrichmentResult);
      }

      // Create enriched data object, filtering out undefined values
      const enrichedData = {
        ...enrichmentResult.data,
        created_at: new Date().toISOString(),
        tracked_by: req.user.userId,
      };

      // Only add fields if they have values
      if (sessionId !== undefined && sessionId !== null) {
        enrichedData.sessionId = sessionId;
      }
      if (pageUrl !== undefined && pageUrl !== null) {
        enrichedData.pageUrl = pageUrl;
      }
      if (timestamp !== undefined && timestamp !== null) {
        enrichedData.timestamp = timestamp;
      }

      // Save to database
      const docRef = await db.collection("visitor_data").add(enrichedData);

      Logger.info("Tracking", "Visitor data saved successfully", {
        docId: docRef.id,
        ipAddress,
        company: enrichedData.zoominfo_data?.company_name || "Unknown",
      });

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        data: enrichedData,
        id: docRef.id,
      });
    } catch (error) {
      Logger.error("Tracking", "Error processing visitor data", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Failed to save data to database.",
      });
    }
  }
);

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     summary: Get all visitor data
 *     description: Retrieves all stored visitor data from the database
 *     tags: [Visitors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of visitors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "doc_id_123"
 *                   ip:
 *                     type: string
 *                     example: "204.79.197.200"
 *                   as_name:
 *                     type: string
 *                     example: "MICROSOFT-CORP-MSN-AS-BLOCK"
 *                   as_domain:
 *                     type: string
 *                     example: "microsoft.com"
 *                   type:
 *                     type: string
 *                     example: "business"
 *                   sessionId:
 *                     type: string
 *                   pageUrl:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                   zoominfo_data:
 *                     type: object
 *                     properties:
 *                       company_name:
 *                         type: string
 *                       domain:
 *                         type: string
 *                       employees:
 *                         type: number
 *                       industry:
 *                         type: string
 *                       headquarters:
 *                         type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Token missing or expired
 *       403:
 *         description: Forbidden - Invalid token or insufficient permissions (Admin required)
 *       500:
 *         description: Error retrieving visitor data
 */
router.get(
  "/visitors",
  authenticateJWT,
  requireRole([USER_ROLES.ADMIN]),
  async (req, res) => {
    try {
      const snapshot = await db.collection("visitor_data").get();
      const visitors = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(visitors);
    } catch (error) {
      Logger.error("Routes", "Error retrieving visitors from Firestore", error);
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve visitor data.",
      });
    }
  }
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     description: Create a new user with @consultadd.com email
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
 *                 example: "newuser@consultadd.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid email domain or user already exists
 *       403:
 *         description: Admin access required
 */
router.post(
  "/users",
  authenticateJWT,
  requireRole([USER_ROLES.ADMIN]),
  async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Email and password are required",
      });
    }

    const result = await UserService.createUser(
      email,
      password,
      req.user.userId
    );

    if (!result.success) {
      return res.status(400).json({
        error: "Bad Request",
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      userId: result.userId,
    });
  }
);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *       403:
 *         description: Admin access required
 */
router.get(
  "/users",
  authenticateJWT,
  requireRole([USER_ROLES.ADMIN]),
  async (req, res) => {
    const result = await UserService.getAllUsers();

    if (!result.success) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: result.message,
      });
    }

    res.json({
      success: true,
      users: result.users,
    });
  }
);

/**
 * @swagger
 * /api/users/{userId}/status:
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
router.patch(
  "/users/:userId/status",
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "Bad Request",
        message: "isActive must be a boolean value",
      });
    }

    const result = await UserService.updateUserStatus(userId, isActive);

    if (!result.success) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  }
);

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
router.delete(
  "/users/:userId",
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    const { userId } = req.params;

    const result = await UserService.deleteUser(userId);

    if (!result.success) {
      return res.status(500).json({
        error: "Internal Server Error",
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  }
);

/**
 * @swagger
 * /api/dashboard-summary:
 *   get:
 *     summary: Get dashboard summary data
 *     description: Retrieve analytics data including company visit counts and daily visits
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalVisits:
 *                       type: number
 *                       example: 45
 *                     uniqueCompanies:
 *                       type: number
 *                       example: 12
 *                     businessVisits:
 *                       type: number
 *                       example: 38
 *                     filteredVisits:
 *                       type: number
 *                       example: 7
 *                 companyCounts:
 *                   type: object
 *                   description: Number of visits per company
 *                   example:
 *                     "Microsoft Corporation": 15
 *                     "Google LLC": 8
 *                     "Unknown": 3
 *                 dailyVisits:
 *                   type: object
 *                   description: Number of visits per day
 *                   example:
 *                     "2024-01-15": 12
 *                     "2024-01-16": 18
 *                     "2024-01-17": 6
 *       401:
 *         description: Unauthorized - Token missing or expired
 *       403:
 *         description: Forbidden - Invalid token
 *       500:
 *         description: Error retrieving dashboard data
 */
/**
 * @swagger
 * /api/enrichment-domains:
 *   get:
 *     summary: Get available enrichment domains
 *     description: List all domains that have enrichment data available for testing
 *     tags: [Testing]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 domains:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["microsoft.com", "google.com", "virginia.edu"]
 *                 count:
 *                   type: number
 *                   example: 6
 */
router.get(
  "/enrichment-domains",
  authenticateJWT,
  requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]),
  (req, res) => {
    const domains = IPEnrichmentService.getAvailableEnrichmentDomains();

    res.json({
      success: true,
      domains: domains,
      count: domains.length,
      message: "Available enrichment domains retrieved successfully",
    });
  }
);

/**
 * @swagger
 * /api/company/{domain}:
 *   get:
 *     summary: Get company profile by domain
 *     description: Retrieve detailed company information including contacts, technologies, and financial data
 *     tags: [Company Intelligence]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         example: microsoft.com
 *         description: Company domain name
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 company_name:
 *                   type: string
 *                   example: "Microsoft Corporation"
 *                 domain:
 *                   type: string
 *                   example: "microsoft.com"
 *                 logo_url:
 *                   type: string
 *                   example: "https://logo.clearbit.com/microsoft.com"
 *                 employees:
 *                   type: string
 *                   example: "221,000"
 *                 revenue:
 *                   type: string
 *                   example: "$211.9B"
 *                 industry:
 *                   type: string
 *                   example: "Software & Technology"
 *                 headquarters:
 *                   type: string
 *                   example: "Redmond, WA"
 *                 founded:
 *                   type: number
 *                   example: 1975
 *                 stock_symbol:
 *                   type: string
 *                   example: "MSFT"
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       role:
 *                         type: string
 *                       department:
 *                         type: string
 *                       email:
 *                         type: string
 *                 technologies:
 *                   type: array
 *                   items:
 *                     type: string
 *                 social_media:
 *                   type: object
 *                   properties:
 *                     linkedin:
 *                       type: string
 *                     twitter:
 *                       type: string
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Company not found"
 *       401:
 *         description: Unauthorized - Token missing or expired
 *       403:
 *         description: Forbidden - Invalid token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Retrieve cache performance metrics and statistics
 *     tags: [Cache Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalEntries:
 *                       type: number
 *                     activeEntries:
 *                       type: number
 *                     expiredEntries:
 *                       type: number
 *                     memoryUsage:
 *                       type: string
 *                     entries:
 *                       type: array
 */
router.get("/cache/stats", authenticateJWT, requireAdmin, (req, res) => {
  try {
    const stats = cacheService.getStats();

    res.json({
      success: true,
      stats: stats,
      message: "Cache statistics retrieved successfully",
    });
  } catch (error) {
    Logger.error("Routes", "Error getting cache stats", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cache statistics",
    });
  }
});

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Clear all cache entries
 *     description: Remove all cached data (Admin only)
 *     tags: [Cache Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       403:
 *         description: Admin access required
 */
router.delete("/cache/clear", authenticateJWT, requireAdmin, (req, res) => {
  try {
    cacheService.clear();

    res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error) {
    Logger.error("Routes", "Error clearing cache", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
    });
  }
});

router.get(
  "/company/:domain",
  authenticateJWT,
  requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]),
  async (req, res) => {
    const domain = req.params.domain;

    try {
      // Get company profile from enrichment service
      const companyProfile = await CompanyEnrichmentService.enrichCompanyData(
        domain
      );

      if (!companyProfile) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
          available_domains: CompanyEnrichmentService.getAvailableDomains(),
        });
      }

      res.status(200).json({
        success: true,
        data: companyProfile,
        message: "Company profile retrieved successfully",
      });
    } catch (error) {
      Logger.error("Routes", "Error fetching company profile", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

router.get(
  "/dashboard-summary",
  authenticateJWT,
  requireRole([USER_ROLES.USER, USER_ROLES.ADMIN]),
  async (req, res) => {
    try {
      const snapshot = await db.collection("visitor_data").get();
      const visitors = snapshot.docs.map((doc) => doc.data());

      // Count visits by company
      const companyCounts = visitors.reduce((acc, visitor) => {
        const company = visitor.zoominfo_data
          ? visitor.zoominfo_data.company_name
          : "Unknown";
        acc[company] = (acc[company] || 0) + 1;
        return acc;
      }, {});

      // Count visits by day
      const dailyVisits = visitors.reduce((acc, visitor) => {
        // Use created_at if timestamp is not available
        const dateString = visitor.timestamp || visitor.created_at;
        if (dateString) {
          const date = new Date(dateString).toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculate additional metrics
      const totalVisits = visitors.length;
      const uniqueCompanies = Object.keys(companyCounts).length;
      const businessVisits = visitors.filter((v) => v.zoominfo_data).length;
      const filteredVisits = totalVisits - businessVisits;

      res.json({
        summary: {
          totalVisits,
          uniqueCompanies,
          businessVisits,
          filteredVisits,
        },
        companyCounts,
        dailyVisits,
      });
    } catch (error) {
      Logger.error(
        "Routes",
        "Error retrieving dashboard summary from Firestore",
        error
      );
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve dashboard summary data.",
      });
    }
  }
);

/**
 * @swagger
 * /api/simple-test:
 *   post:
 *     summary: Simple testing endpoint for manual testing
 *     description: Basic endpoint to collect visitor data for testing (no authentication required)
 *     tags: [Testing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *               - sessionId
 *               - pageUrl
 *               - timestamp
 *             properties:
 *               ipAddress:
 *                 type: string
 *                 example: "203.0.113.1"
 *                 description: Visitor's IP address
 *               sessionId:
 *                 type: string
 *                 example: "session-abc123xyz"
 *                 description: Unique session identifier
               pageUrl:
 *                 oneOf:
 *                   - type: string
 *                     example: "https://example.com/landing-page"
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["https://example.com/home", "https://example.com/about"]
 *                 description: Current page URL (string) or page history (array)
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T12:00:00.000Z"
 *                 description: Visit timestamp (optional, auto-generated if not provided)
 *               timezone:
 *                 type: string
 *                 example: "45 seconds"
 *                 description: Session duration in human-readable format (optional)
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
 *                   example: "Test data stored successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Firebase document ID
 *                     ipAddress:
 *                       type: string
 *                     sessionId:
 *                       type: string
 *                     pageUrl:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [new_record, already_exists]
 *                       description: Whether this is a new record or IP already existed
 *                     firstSeen:
 *                       type: string
 *                       description: When this IP was first seen (only for already_exists)
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/simple-test", async (req, res) => {
  try {
    const { ipAddress, sessionId, pageUrl, timestamp, timezone } = req.body;

    // Handle both old format (pageUrl as string) and new format (pageUrl as array)
    const pageUrlString = Array.isArray(pageUrl)
      ? pageUrl[pageUrl.length - 1] || "unknown"
      : pageUrl;
    const pageHistory = Array.isArray(pageUrl) ? pageUrl : [pageUrl];

    // Handle session duration (timezone field contains duration)
    const sessionDuration = timezone || "unknown";

    // Validate required fields (flexible validation)
    const requiredFields = ["ipAddress", "sessionId"];
    const validation = validateRequiredFields(req.body, requiredFields);
    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: validation.message,
      });
    }

    Logger.info("SimpleTest", "New simple test data", {
      ipAddress,
      sessionId,
      pageUrl,
    });

    // Check if IP address already exists in the database
    const existingIpQuery = await db
      .collection("simple_test_data")
      .where("ipAddress", "==", ipAddress)
      .limit(1)
      .get();

    if (!existingIpQuery.empty) {
      const existingDoc = existingIpQuery.docs[0];
      const existingData = existingDoc.data();

      Logger.info("SimpleTest", "IP address already exists, skipping insert", {
        ipAddress,
        existingDocId: existingDoc.id,
        existingTimestamp: existingData.timestamp,
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "IP address already exists in database",
        data: {
          id: existingDoc.id,
          ipAddress: existingData.ipAddress,
          sessionId: existingData.sessionId,
          pageUrl: existingData.pageUrl,
          pageHistory: existingData.pageHistory || [existingData.pageUrl],
          sessionDuration: existingData.sessionDuration || "unknown",
          timestamp: existingData.timestamp,
          status: "already_exists",
          firstSeen: existingData.collectedAt,
        },
      });
    }

    // IP doesn't exist, proceed with storing new data
    const testData = {
      ipAddress,
      sessionId,
      pageUrl: pageUrlString, // Store the last/current page URL
      pageHistory: pageHistory, // Store full page history
      sessionDuration: sessionDuration, // Store session duration
      timestamp: timestamp || new Date().toISOString(),
      // Add some metadata
      collectedAt: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "unknown",
      source: "simple-test-endpoint",
    };

    // Store in Firebase
    const docRef = await db.collection("simple_test_data").add(testData);

    Logger.info("SimpleTest", "New test data stored successfully", {
      docId: docRef.id,
      ipAddress,
      sessionId,
    });

    // Return success response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Test data stored successfully",
      data: {
        id: docRef.id,
        ipAddress,
        sessionId,
        pageUrl: pageUrlString,
        pageHistory: pageHistory,
        sessionDuration: sessionDuration,
        timestamp: testData.timestamp,
        status: "new_record",
      },
    });
  } catch (error) {
    Logger.error("SimpleTest", "Error storing test data", error);

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to store test data",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
