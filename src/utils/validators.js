/**
 * Input Validation Utilities
 * Centralized validation functions for request data
 */

const { ERROR_MESSAGES } = require("./constants");

/**
 * Validate email format and domain
 */
const validateEmail = (email, allowedDomain) => {
  if (!allowedDomain) {
    throw new Error("allowedDomain parameter is required for email validation");
  }
  if (!email || typeof email !== "string") {
    return { isValid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  if (!email.endsWith(`@${allowedDomain}`)) {
    return {
      isValid: false,
      message: `Email must be from ${allowedDomain} domain`,
    };
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

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    };
  }

  return { isValid: true };
};

/**
 * Validate IP address format
 */
const validateIPAddress = (ip) => {
  if (!ip || typeof ip !== "string") {
    return { isValid: false, message: "IP address is required" };
  }

  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (!ipRegex.test(ip)) {
    return { isValid: false, message: "Invalid IP address format" };
  }

  return { isValid: true };
};

/**
 * Validate URL format
 */
const validateURL = (url) => {
  if (!url || typeof url !== "string") {
    return { isValid: false, message: "URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, message: "Invalid URL format" };
  }
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
  validateIPAddress,
  validateURL,
  validateRequiredFields,
};
