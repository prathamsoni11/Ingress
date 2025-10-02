/**
 * Input Validation Utilities
 * Centralized validation functions for request data
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  return { isValid: true };
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  return { isValid: true };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(
    (field) =>
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
  );

  if (missing.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  return { isValid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequiredFields,
};
