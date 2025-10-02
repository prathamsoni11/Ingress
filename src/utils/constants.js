/**
 * Application Constants
 * Centralized configuration and constants
 */

module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },

  // JWT Configuration
  JWT: {
    DEFAULT_EXPIRES_IN: "30d",
    ALGORITHM: "HS256",
  },

  // User Roles
  USER_ROLES: {
    ADMIN: "admin",
    USER: "user",
  },

  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: "Invalid email or password",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Insufficient permissions",
    USER_NOT_FOUND: "User not found",
    ACCOUNT_DEACTIVATED: "Account is deactivated",
    MISSING_REQUIRED_FIELDS: "Missing required fields",
    INTERNAL_ERROR: "Internal server error",
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: "Login successful",
    USER_CREATED: "User created successfully",
    USER_UPDATED: "User updated successfully",
    USER_DELETED: "User deleted successfully",
    DATA_RETRIEVED: "Data retrieved successfully",
  },
};
