import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import logger from '../utils/DebugLogger';

/**
 * Test Error Screen
 *
 * This screen allows you to test all the debugging features:
 * - Error Boundary (catch crashes)
 * - Debug Logger (logging)
 * - Different types of errors
 *
 * Usage: Add this screen to your navigation temporarily for testing
 */
const TestErrorScreen = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  // Test 1: Immediate crash (caught by Error Boundary)
  if (shouldCrash) {
    throw new Error('TEST CRASH: This is a simulated error to test the Error Boundary');
  }

  // Test 2: Async error (not caught by Error Boundary, but logged)
  const handleAsyncError = async () => {
    try {
      logger.info('TEST', 'Starting async operation...');

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Throw error
      throw new Error('TEST ASYNC ERROR: Simulated async operation failure');
    } catch (error) {
      logger.error('TEST', 'Async operation failed', {
        error: error.toString(),
        stack: error.stack
      });
      alert('Async error occurred! Check logs via debug menu (tap blue circle 5x)');
    }
  };

  // Test 3: Unhandled promise rejection
  const handleUnhandledRejection = () => {
    logger.info('TEST', 'Triggering unhandled promise rejection...');

    // This will cause an unhandled rejection
    Promise.reject(new Error('TEST UNHANDLED REJECTION: This should be caught by global handler'));

    alert('Unhandled rejection triggered! Check console and logs.');
  };

  // Test 4: Log various levels
  const handleTestLogging = () => {
    logger.debug('TEST', 'This is a DEBUG message');
    logger.info('TEST', 'This is an INFO message', { data: 'some data' });
    logger.warn('TEST', 'This is a WARNING message', { warning: 'something suspicious' });
    logger.error('TEST', 'This is an ERROR message', { error: 'something went wrong' });

    alert('Logged 4 messages! Tap blue circle 5x to see them in debug menu.');
  };

  // Test 5: Simulate Firebase error
  const handleFirebaseError = () => {
    const mockError = {
      code: 'permission-denied',
      message: 'Missing or insufficient permissions',
      toString: () => 'FirebaseError: Missing or insufficient permissions'
    };

    logger.trackFirebaseError('GET_COLLECTION', mockError);

    alert('Firebase error logged! Check debug menu.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test Debugging Features</Text>
        <Text style={styles.subtitle}>
          Use these buttons to test the error reporting system
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Boundary Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={() => setShouldCrash(true)}
        >
          <Text style={styles.buttonText}>💥 Trigger Crash (Error Boundary)</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          This will trigger a render error. You should see the error screen with
          "Send Error Report" button.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Async Error Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleAsyncError}
        >
          <Text style={styles.buttonText}>⏱️ Trigger Async Error</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Simulates an async operation failure. Won't crash the app but will log
          the error. Check debug menu after.
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleUnhandledRejection}
        >
          <Text style={styles.buttonText}>🚫 Unhandled Promise Rejection</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Triggers an unhandled promise rejection. Check console logs.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logging Tests</Text>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleTestLogging}
        >
          <Text style={styles.buttonText}>📝 Test All Log Levels</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Logs DEBUG, INFO, WARN, and ERROR messages. View them in the debug menu
          (tap blue circle 5 times).
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleFirebaseError}
        >
          <Text style={styles.buttonText}>🔥 Simulate Firebase Error</Text>
        </TouchableOpacity>
        <Text style={styles.description}>
          Logs a simulated Firebase/Firestore error with error code and message.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Test</Text>
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>1. Try "Trigger Crash" first</Text>
          <Text style={styles.instructionText}>   → Should show error screen</Text>
          <Text style={styles.instructionText}>   → Tap "Send Error Report" to test sharing</Text>
          <Text style={styles.instructionText}>   → Tap "Try Again" to recover</Text>

          <Text style={[styles.instructionText, styles.instructionSpacer]}>
            2. Try "Test All Log Levels"
          </Text>
          <Text style={styles.instructionText}>   → Look for blue circle at bottom-right</Text>
          <Text style={styles.instructionText}>   → Tap it 5 times quickly</Text>
          <Text style={styles.instructionText}>   → Tap "View Stats" to see log count</Text>
          <Text style={styles.instructionText}>   → Tap "Export & Send Logs" to test sharing</Text>

          <Text style={[styles.instructionText, styles.instructionSpacer]}>
            3. Try other error types
          </Text>
          <Text style={styles.instructionText}>   → Test async errors and Firebase errors</Text>
          <Text style={styles.instructionText}>   → Verify they appear in debug menu</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✨ After testing, remove this screen from your navigation
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
  },
  warningButton: {
    backgroundColor: '#f57c00',
  },
  infoButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  instructions: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  instructionSpacer: {
    marginTop: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default TestErrorScreen;
