/**
 * Logging Utility
 * Centralized logging with different levels and formatting
 */

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const LOG_COLORS = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m", // Yellow
  INFO: "\x1b[36m", // Cyan
  DEBUG: "\x1b[37m", // White
  RESET: "\x1b[0m", // Reset
};

class Logger {
  static formatMessage(level, service, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level] || LOG_COLORS.INFO;
    const reset = LOG_COLORS.RESET;

    let logMessage = `${color}[${timestamp}] ${level} [${service}] ${message}${reset}`;

    if (data) {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }

    return logMessage;
  }

  static error(service, message, data = null) {
    console.error(this.formatMessage(LOG_LEVELS.ERROR, service, message, data));
  }

  static warn(service, message, data = null) {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, service, message, data));
  }

  static info(service, message, data = null) {
    console.log(this.formatMessage(LOG_LEVELS.INFO, service, message, data));
  }

  static debug(service, message, data = null) {
    if (process.env.NODE_ENV === "development") {
      console.log(this.formatMessage(LOG_LEVELS.DEBUG, service, message, data));
    }
  }

  static request(method, path, statusCode, responseTime = null) {
    const message = `${method} ${path} - ${statusCode}${
      responseTime ? ` (${responseTime}ms)` : ""
    }`;

    if (statusCode >= 400) {
      this.error("HTTP", message);
    } else {
      this.info("HTTP", message);
    }
  }
}

module.exports = Logger;
