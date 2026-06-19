import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Alert, Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/DebugLogger';

/**
 * DebugMenu Component
 *
 * Usage: Add this to your main navigation or any screen where you want debug access
 *
 * Example:
 * import DebugMenu from '../components/DebugMenu';
 *
 * // In your component:
 * <DebugMenu visible={true} />  // Always show in development
 * <DebugMenu visible={__DEV__} />  // Only in development mode
 */
const DebugMenu = ({ visible = __DEV__ }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (tapCount >= 5) {
      setShowMenu(true);
      setTapCount(0);
    }
  }, [tapCount]);

  const handleSecretTap = () => {
    setTapCount(prev => prev + 1);
    setTimeout(() => setTapCount(0), 3000); // Reset after 3 seconds
  };

  const handleExportLogs = async () => {
    try {
      const logsString = await logger.exportLogs();

      const errorLogsData = await AsyncStorage.getItem('app_error_logs');
      const errorLogs = errorLogsData ? JSON.parse(errorLogsData) : [];

      const deviceInfo = `
Device Platform: ${Platform.OS}
Device Version: ${Platform.Version}
App Version: 1.7.0
Export Time: ${new Date().toISOString()}
`;

      const fullReport = `
PREMISE SECURITY MOBILE - DEBUG REPORT
======================================

${deviceInfo}

=== ERROR LOGS ===
${JSON.stringify(errorLogs, null, 2)}

=== DEBUG LOGS ===
${logsString}

======================================
Please send this report to your IT support team
Email: support@example.com
      `;

      await Share.share({
        message: fullReport,
        title: 'Premise Security - Debug Logs',
        subject: 'Premise Security App - Debug Report',
      });

      setShowMenu(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await logger.clearLogs();
            await AsyncStorage.removeItem('app_error_logs');
            Alert.alert('Success', 'All logs cleared');
            setShowMenu(false);
          },
        },
      ]
    );
  };

  const handleViewStats = async () => {
    const logs = await logger.getLogs();
    const errorLogs = await AsyncStorage.getItem('app_error_logs');
    const errors = errorLogs ? JSON.parse(errorLogs) : [];

    const errorCount = logs.filter(log => log.level === 'ERROR').length;
    const warnCount = logs.filter(log => log.level === 'WARN').length;

    Alert.alert(
      'Debug Stats',
      `Total Logs: ${logs.length}\nErrors: ${errorCount}\nWarnings: ${warnCount}\nCrashes: ${errors.length}`,
      [{ text: 'OK' }]
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Hidden button to activate debug menu - tap 5 times */}
      <TouchableOpacity
        style={styles.secretButton}
        onPress={handleSecretTap}
        activeOpacity={1}
      >
        <Text style={styles.secretButtonText}>{tapCount > 0 ? tapCount : ''}</Text>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Debug Menu</Text>

            <TouchableOpacity style={styles.menuButton} onPress={handleViewStats}>
              <Text style={styles.menuButtonText}>View Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleExportLogs}>
              <Text style={styles.menuButtonText}>Export & Send Logs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleClearLogs}>
              <Text style={[styles.menuButtonText, styles.dangerText]}>Clear Logs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, styles.closeButton]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  secretButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(33, 150, 243, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  secretButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerText: {
    color: '#ff5252',
  },
  closeButton: {
    backgroundColor: '#757575',
    marginTop: 10,
  },
});

export default DebugMenu;
