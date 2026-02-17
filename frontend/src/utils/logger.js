/* eslint-disable no-console */
/**
 * Frontend Logger Utility
 * Centralized logging with environment-aware output control
 *
 * Features:
 * - Suppresses logs in production (unless explicitly enabled)
 * - Structured logging with consistent format
 * - Log levels: debug, info, warn, error
 * - Context tagging for filtering
 * - Remote logging support (optional)
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Configuration
const config = {
  // Enable logging in development, disable in production by default
  enabled: import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGGING === 'true',
  // Minimum log level to output
  minLevel: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.DEV ? 'debug' : 'warn'),
  // Include timestamps in logs
  timestamps: true,
  // Send errors to remote logging service (if configured)
  remoteLogging: import.meta.env.VITE_REMOTE_LOGGING === 'true',
  remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT || '/api/logs',
};

/**
 * Format log message with optional context
 */
const formatMessage = (level, message, context = null) => {
  const parts = [];

  if (config.timestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  parts.push(`[${level.toUpperCase()}]`);

  if (context) {
    parts.push(`[${context}]`);
  }

  parts.push(message);

  return parts.join(' ');
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level) => {
  if (!config.enabled) {
    return false;
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

/**
 * Send error to remote logging service
 */
const sendToRemote = async (level, message, data = null, context = null) => {
  if (!config.remoteLogging || level !== 'error') {
    return;
  }

  try {
    await fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    // Silently fail - don't cause more errors trying to log errors
  }
};

/**
 * Logger object with methods for each log level
 */
const logger = {
  /**
   * Debug level - verbose information for development
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   * @param {string} context - Optional context tag (e.g., 'AIScribe', 'Auth')
   */
  debug(message, data = null, context = null) {
    if (!shouldLog('debug')) {
      return;
    }
    const formatted = formatMessage('debug', message, context);
    if (data !== null) {
      console.debug(formatted, data);
    } else {
      console.debug(formatted);
    }
  },

  /**
   * Info level - general information
   */
  info(message, data = null, context = null) {
    if (!shouldLog('info')) {
      return;
    }
    const formatted = formatMessage('info', message, context);
    if (data !== null) {
      console.info(formatted, data);
    } else {
      console.info(formatted);
    }
  },

  /**
   * Warn level - warnings that don't stop execution
   */
  warn(message, data = null, context = null) {
    if (!shouldLog('warn')) {
      return;
    }
    const formatted = formatMessage('warn', message, context);
    if (data !== null) {
      console.warn(formatted, data);
    } else {
      console.warn(formatted);
    }
  },

  /**
   * Error level - errors that need attention
   */
  error(message, data = null, context = null) {
    if (!shouldLog('error')) {
      return;
    }
    const formatted = formatMessage('error', message, context);
    if (data !== null) {
      console.error(formatted, data);
    } else {
      console.error(formatted);
    }
    // Send to remote logging if configured
    sendToRemote('error', message, data, context);
  },

  /**
   * Log with explicit level
   */
  log(level, message, data = null, context = null) {
    switch (level) {
      case 'debug':
        this.debug(message, data, context);
        break;
      case 'info':
        this.info(message, data, context);
        break;
      case 'warn':
        this.warn(message, data, context);
        break;
      case 'error':
        this.error(message, data, context);
        break;
      default:
        this.info(message, data, context);
    }
  },

  /**
   * Create a scoped logger with a fixed context
   * @param {string} context - Context tag for all logs from this logger
   * @returns {object} Scoped logger object
   */
  scope(context) {
    return {
      debug: (message, data = null) => logger.debug(message, data, context),
      info: (message, data = null) => logger.info(message, data, context),
      warn: (message, data = null) => logger.warn(message, data, context),
      error: (message, data = null) => logger.error(message, data, context),
    };
  },

  /**
   * Update logger configuration at runtime
   */
  configure(options) {
    Object.assign(config, options);
  },

  /**
   * Check if logging is enabled
   */
  isEnabled() {
    return config.enabled;
  },
};

export default logger;
export { logger };
