const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");

/**
 * User Service
 * Handles user authentication and management
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
        console.log("[UserService] Admin credentials not configured");
        return;
      }

      // Check if admin already exists
      const adminQuery = await db
        .collection("users")
        .where("email", "==", adminEmail)
        .get();

      if (adminQuery.empty) {
        // Create admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await db.collection("users").add({
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: "system",
        });

        console.log(`[UserService] Admin user created: ${adminEmail}`);
      } else {
        console.log(`[UserService] Admin user already exists: ${adminEmail}`);
      }
    } catch (error) {
      console.error("[UserService] Error initializing admin:", error.message);
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email, password) {
    try {
      // Validate email domain
      const allowedDomain =
        process.env.ALLOWED_EMAIL_DOMAIN || "consultadd.com";
      if (!email.endsWith(`@${allowedDomain}`)) {
        return {
          success: false,
          message: `Email must be from ${allowedDomain} domain`,
        };
      }

      // Find user by email
      const userQuery = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (userQuery.empty) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Check if user is active
      if (!userData.isActive) {
        return {
          success: false,
          message: "Account is deactivated. Please contact admin.",
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (!isPasswordValid) {
        return {
          success: false,
          message: "Invalid email or password",
        };
      }

      // Return user info (without password)
      return {
        success: true,
        user: {
          id: userDoc.id,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
        },
      };
    } catch (error) {
      console.error("[UserService] Authentication error:", error);
      return {
        success: false,
        message: "Authentication failed",
      };
    }
  }

  /**
   * Create new user (admin only)
   */
  static async createUser(email, password, createdByUserId) {
    try {
      // Validate email domain
      const allowedDomain =
        process.env.ALLOWED_EMAIL_DOMAIN || "consultadd.com";
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
      console.error("[UserService] Create user error:", error);
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
      console.error("[UserService] Get users error:", error);
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
      console.error("[UserService] Update user status error:", error);
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
      console.error("[UserService] Delete user error:", error);
      return {
        success: false,
        message: "Failed to delete user",
      };
    }
  }
}

module.exports = UserService;
