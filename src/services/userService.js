const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const Logger = require("../utils/logger");
const { validateEmail, validatePassword } = require("../utils/validators");
const { ERROR_MESSAGES, USER_ROLES } = require("../utils/constants");
const { getEnv } = require("../utils/env");

/**
 * User Service
 * Handles user authentication and management with enhanced security and validation
 */
class UserService {
  /**
   * Initialize admin user if not exists
   */
  static async initializeAdmin() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        Logger.warn(
          "UserService",
          "Admin credentials not configured in environment variables"
        );
        return;
      }

      // Validate admin email format
      const emailValidation = validateEmail(
        adminEmail,
        getEnv("ALLOWED_EMAIL_DOMAIN")
      );
      if (!emailValidation.isValid) {
        Logger.error("UserService", "Invalid admin email format", {
          email: adminEmail,
        });
        return;
      }

      // Check if admin already exists
      const adminQuery = await db
        .collection("users")
        .where("email", "==", adminEmail)
        .get();

      if (adminQuery.empty) {
        // Validate password strength
        const passwordValidation = validatePassword(adminPassword);
        if (!passwordValidation.isValid) {
          Logger.error(
            "UserService",
            "Admin password does not meet requirements",
            {
              message: passwordValidation.message,
            }
          );
          return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 12); // Increased salt rounds

        await db.collection("users").add({
          email: adminEmail,
          password: hashedPassword,
          role: USER_ROLES.ADMIN,
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system",
          lastLogin: null,
          loginAttempts: 0,
        });

        Logger.info("UserService", "Admin user created successfully", {
          email: adminEmail,
        });
      } else {
        Logger.info("UserService", "Admin user already exists", {
          email: adminEmail,
        });
      }
    } catch (error) {
      Logger.error("UserService", "Error initializing admin user", error);
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email, password) {
    try {
      // Input validation
      if (!email || !password) {
        Logger.warn(
          "UserService",
          "Authentication attempt with missing credentials"
        );
        return {
          success: false,
          message: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        };
      }

      // Validate email format and domain
      const allowedDomain = getEnv("ALLOWED_EMAIL_DOMAIN");
      const emailValidation = validateEmail(email, allowedDomain);

      if (!emailValidation.isValid) {
        Logger.warn("UserService", "Authentication failed - invalid email", {
          email,
        });
        return {
          success: false,
          message: emailValidation.message,
        };
      }

      // Find user by email
      const userQuery = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userQuery.empty) {
        Logger.warn("UserService", "Authentication failed - user not found", {
          email,
        });
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Check if user is active
      if (!userData.isActive) {
        Logger.warn(
          "UserService",
          "Authentication failed - account deactivated",
          {
            email,
            userId: userDoc.id,
          }
        );
        return {
          success: false,
          message: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
        };
      }

      // Check for account lockout (basic brute force protection)
      const maxLoginAttempts = 5;
      if (userData.loginAttempts >= maxLoginAttempts) {
        Logger.warn("UserService", "Authentication failed - account locked", {
          email,
          attempts: userData.loginAttempts,
        });
        return {
          success: false,
          message:
            "Account temporarily locked due to multiple failed login attempts. Please contact admin.",
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (!isPasswordValid) {
        // Increment login attempts
        await db
          .collection("users")
          .doc(userDoc.id)
          .update({
            loginAttempts: (userData.loginAttempts || 0) + 1,
            lastFailedLogin: new Date().toISOString(),
          });

        Logger.warn("UserService", "Authentication failed - invalid password", {
          email,
          attempts: (userData.loginAttempts || 0) + 1,
        });

        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Reset login attempts and update last login
      await db.collection("users").doc(userDoc.id).update({
        loginAttempts: 0,
        lastLogin: new Date().toISOString(),
      });

      Logger.info("UserService", "User authenticated successfully", {
        email,
        userId: userDoc.id,
        role: userData.role,
      });

      // Return user info (without password)
      return {
        success: true,
        user: {
          id: userDoc.id,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          lastLogin: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error("UserService", "Authentication error", error);
      return {
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      };
    }
  }

  /**
   * Create new user (admin only)
   */
  static async createUser(email, password, createdByUserId) {
    try {
      // Validate email domain
      const allowedDomain = getEnv("ALLOWED_EMAIL_DOMAIN");
      if (!email.endsWith(`@${allowedDomain}`)) {
        return {
          success: false,
          message: `Email must be from ${allowedDomain} domain`,
        };
      }

      // Check if user already exists
      const existingUserQuery = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!existingUserQuery.empty) {
        return {
          success: false,
          message: "User with this email already exists",
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userRef = await db.collection("users").add({
        email: email,
        password: hashedPassword,
        role: "user",
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: createdByUserId,
      });

      return {
        success: true,
        message: "User created successfully",
        userId: userRef.id,
      };
    } catch (error) {
      Logger.error("UserService", "Create user error", error);
      return {
        success: false,
        message: "Failed to create user",
      };
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers() {
    try {
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        role: doc.data().role,
        isActive: doc.data().isActive,
        createdAt: doc.data().createdAt,
        createdBy: doc.data().createdBy,
      }));

      return {
        success: true,
        users: users,
      };
    } catch (error) {
      Logger.error("UserService", "Get users error", error);
      return {
        success: false,
        message: "Failed to retrieve users",
      };
    }
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(userId, isActive) {
    try {
      await db.collection("users").doc(userId).update({
        isActive: isActive,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      };
    } catch (error) {
      Logger.error("UserService", "Update user status error", error);
      return {
        success: false,
        message: "Failed to update user status",
      };
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(userId) {
    try {
      await db.collection("users").doc(userId).delete();

      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error) {
      Logger.error("UserService", "Delete user error", error);
      return {
        success: false,
        message: "Failed to delete user",
      };
    }
  }
}

module.exports = UserService;
