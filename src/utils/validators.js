/**
 * Input Validation Utilities
 * Simple validation functions for the test data collection API
 */

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
  validateRequiredFields,
};
