import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error with timestamp
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      stack: error.stack
    };

    // Store error logs locally
    try {
      const existingLogs = await AsyncStorage.getItem('app_error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.shift();
      }

      await AsyncStorage.setItem('app_error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleSendLogs = async () => {
    try {
      // Get all error logs
      const errorLogsData = await AsyncStorage.getItem('app_error_logs');
      const errorLogs = errorLogsData ? JSON.parse(errorLogsData) : [];

      // Get debug logs
      const debugLogsData = await AsyncStorage.getItem('debug_logs');
      const debugLogs = debugLogsData ? JSON.parse(debugLogsData) : [];

      const deviceInfo = `
Device Platform: ${Platform.OS}
Device Version: ${Platform.Version}
App Version: 1.7.0
Error Time: ${new Date().toISOString()}
`;

      const currentError = `
Current Error:
${this.state.error?.toString()}

Stack Trace:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}
`;

      const fullReport = `
PREMISE SECURITY MOBILE - CRASH REPORT
=======================================

${deviceInfo}

${currentError}

=== RECENT ERROR LOGS (Last 10) ===
${JSON.stringify(errorLogs.slice(-10), null, 2)}

=== RECENT DEBUG LOGS (Last 50) ===
${JSON.stringify(debugLogs.slice(-50), null, 2)}

=======================================
Please send this report to your IT support team
      `;

      const result = await Share.share({
        message: fullReport,
        title: 'Premise Security - Crash Report',
        subject: 'Premise Security App - Crash Report',
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Logs shared successfully. Thank you for reporting this issue!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share logs. Please contact IT support directly.');
      console.error('Failed to share logs:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an error. This has been logged.
          </Text>
          {__DEV__ && (
            <>
              <Text style={styles.errorText}>
                {this.state.error?.toString()}
              </Text>
              <Text style={styles.stackTrace}>
                {this.state.errorInfo?.componentStack}
              </Text>
            </>
          )}
          <TouchableOpacity style={styles.sendButton} onPress={this.handleSendLogs}>
            <Text style={styles.buttonText}>Send Error Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  stackTrace: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    maxHeight: 200,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ErrorBoundary;
