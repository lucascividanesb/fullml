const util = require('util');

/**
 * A simple but effective logger utility for API routes and other backend services.
 * Adds timestamps, log levels, and stringifies objects nicely.
 */
class Logger {
  constructor(context = '') {
    this.context = context;
  }

  _formatMessage(level, message, ...meta) {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    
    // Format meta objects nicely if they exist
    const metaStr = meta.length 
      ? ' ' + meta.map(m => typeof m === 'object' ? util.inspect(m, { depth: null, colors: true }) : m).join(' ')
      : '';

    return `${timestamp} ${level} ${contextStr}${message}${metaStr}`;
  }

  info(message, ...meta) {
    console.log(this._formatMessage('\x1b[36mINFO\x1b[0m', message, ...meta));
  }

  warn(message, ...meta) {
    console.warn(this._formatMessage('\x1b[33mWARN\x1b[0m', message, ...meta));
  }

  error(message, ...meta) {
    console.error(this._formatMessage('\x1b[31mERROR\x1b[0m', message, ...meta));
  }

  debug(message, ...meta) {
    // Only log debug in development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this._formatMessage('\x1b[34mDEBUG\x1b[0m', message, ...meta));
    }
  }
}

// Export a default instance
export const logger = new Logger();

// Factory to create context-aware loggers
export const createLogger = (context) => new Logger(context);
