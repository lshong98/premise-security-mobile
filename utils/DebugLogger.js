import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class DebugLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 500;
    this.enabled = true; // Set to false in production if needed
  }

  async initialize() {
    try {
      const savedLogs = await AsyncStorage.getItem('debug_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load debug logs:', error);
    }
  }

  log(level, category, message, data = null) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      platform: Platform.OS,
    };

    console.log(`[${level}] [${category}] ${message}`, data || '');

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to AsyncStorage (debounced in production)
    this.saveLogs();
  }

  info(category, message, data) {
    this.log('INFO', category, message, data);
  }

  warn(category, message, data) {
    this.log('WARN', category, message, data);
  }

  error(category, message, data) {
    this.log('ERROR', category, message, data);
  }

  debug(category, message, data) {
    if (__DEV__) {
      this.log('DEBUG', category, message, data);
    }
  }

  async saveLogs() {
    try {
      await AsyncStorage.setItem('debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save debug logs:', error);
    }
  }

  async getLogs(filter = null) {
    if (filter) {
      return this.logs.filter(log => {
        if (filter.level && log.level !== filter.level) return false;
        if (filter.category && log.category !== filter.category) return false;
        if (filter.startTime && new Date(log.timestamp) < new Date(filter.startTime)) return false;
        if (filter.endTime && new Date(log.timestamp) > new Date(filter.endTime)) return false;
        return true;
      });
    }
    return this.logs;
  }

  async exportLogs() {
    const logsString = JSON.stringify(this.logs, null, 2);
    return logsString;
  }

  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem('debug_logs');
  }

  // Track app lifecycle
  trackAppState(state) {
    this.info('APP_LIFECYCLE', `App state changed to: ${state}`);
  }

  // Track memory usage (Android specific)
  async trackMemory() {
    if (Platform.OS === 'android') {
      try {
        // You can integrate react-native-device-info here if needed
        this.debug('MEMORY', 'Memory check requested');
      } catch (error) {
        this.error('MEMORY', 'Failed to track memory', error);
      }
    }
  }

  // Track Firebase operations
  trackFirebaseOperation(operation, details) {
    this.info('FIREBASE', `Operation: ${operation}`, details);
  }

  trackFirebaseError(operation, error) {
    this.error('FIREBASE', `Operation failed: ${operation}`, {
      error: error.toString(),
      code: error.code,
      message: error.message
    });
  }

  // Track render issues
  trackRender(component, issue = null) {
    if (issue) {
      this.warn('RENDER', `Render issue in ${component}`, issue);
    } else {
      this.debug('RENDER', `Rendered ${component}`);
    }
  }
}

// Singleton instance
const logger = new DebugLogger();
export default logger;
