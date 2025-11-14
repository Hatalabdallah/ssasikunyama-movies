// src/utils/logger.ts

class Logger {
  static log(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[LOG]', ...args);
    }
  }

  static error(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR]', ...args);
    }
  }

  static warn(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WARN]', ...args);
    }
  }

  static info(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  }

  static debug(...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', ...args);
    }
  }
}

export default Logger;