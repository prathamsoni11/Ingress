const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");
const Logger = require("../utils/logger");
const { validateEmail, validatePassword } = require("../utils/validators");
const { ERROR_MESSAGES, USER_ROLES } = require("../utils/constants");

/**
 * User Service
 * Handles user authentication and management
 */
class UserService {
  /**
   * Initialize admin users if not exist
   */
  static async initializeAdmin() {
    try {
      // Support multiple admin users
      const adminEmails = process.env.ADMIN_EMAIL
        ? process.env.ADMIN_EMAIL.split(",")
        : [];
      const adminPasswords = process.env.ADMIN_PASSWORD
        ? process.env.ADMIN_PASSWORD.split(",")
        : [];

      if (adminEmails.length === 0 || adminPasswords.length === 0) {
        Logger.warn("UserService", "Admin credentials not configured");
        return;
      }

      // If only one password provided, use it for all admins
      const passwords =
        adminPasswords.length === 1
          ? new Array(adminEmails.length).fill(adminPasswords[0])
          : adminPasswords;

      if (adminEmails.length !== passwords.length) {
        Logger.warn(
          "UserService",
          "Mismatch between admin emails and passwords count"
        );
        return;
      }

      for (let i = 0; i < adminEmails.length; i++) {
        const email = adminEmails[i].trim();
        const password = passwords[i].trim();

        if (!email || !password) continue;

        // Check if admin already exists
        const adminQuery = await db
          .collection("users")
          .where("email", "==", email)
          .get();

        if (adminQuery.empty) {
          // Create admin user
          const hashedPassword = await bcrypt.hash(password, 12);

          await db.collection("users").add({
            email: email,
            password: hashedPassword,
            role: USER_ROLES.ADMIN,
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: "system",
            lastLogin: null,
          });

          Logger.info("UserService", "Admin user created successfully", {
            email: email,
          });
        } else {
          Logger.info("UserService", "Admin user already exists", { email });
        }
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
      if (!email || !password) {
        return {
          success: false,
          message: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
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
          }
        );
        return {
          success: false,
          message: ERROR_MESSAGES.ACCOUNT_DEACTIVATED,
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (!isPasswordValid) {
        Logger.warn("UserService", "Authentication failed - invalid password", {
          email,
        });
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Update last login
      await db.collection("users").doc(userDoc.id).update({
        lastLogin: new Date().toISOString(),
      });

      Logger.info("UserService", "User authenticated successfully", {
        email,
        userId: userDoc.id,
        role: userData.role,
      });

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
  static async createUser(email, password, role, createdBy) {
    try {
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
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userRef = await db.collection("users").add({
        email: email,
        password: hashedPassword,
        role: role || USER_ROLES.USER,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: createdBy,
        lastLogin: null,
      });

      Logger.info("UserService", "User created successfully", {
        userId: userRef.id,
        email,
        role: role || USER_ROLES.USER,
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
        lastLogin: doc.data().lastLogin,
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
