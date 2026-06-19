import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import logger from '../utils/DebugLogger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DebugLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    const debugLogs = await logger.getLogs(
      filter !== 'ALL' ? { level: filter } : null
    );
    setLogs(debugLogs);

    // Load error boundary logs
    try {
      const errorLogsData = await AsyncStorage.getItem('app_error_logs');
      if (errorLogsData) {
        setErrorLogs(JSON.parse(errorLogsData));
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  };

  const handleExport = async () => {
    try {
      const logsString = await logger.exportLogs();
      const errorLogsString = JSON.stringify(errorLogs, null, 2);

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

=== ERROR BOUNDARY LOGS ===
${errorLogsString}

=== DEBUG LOGS ===
${logsString}

======================================
Please send this report to your IT support team
      `;

      await Share.share({
        message: fullReport,
        title: 'Premise Security - Debug Logs',
        subject: 'Premise Security App - Debug Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await logger.clearLogs();
            await AsyncStorage.removeItem('app_error_logs');
            setLogs([]);
            setErrorLogs([]);
          },
        },
      ]
    );
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return '#d32f2f';
      case 'WARN':
        return '#f57c00';
      case 'INFO':
        return '#1976d2';
      case 'DEBUG':
        return '#388e3c';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Logs</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.buttonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              filter === level && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(level)}
          >
            <Text
              style={[
                styles.filterText,
                filter === level && styles.filterTextActive,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.logContainer}>
        {errorLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Error Boundary Logs ({errorLogs.length})
            </Text>
            {errorLogs.map((log, index) => (
              <View key={`error-${index}`} style={styles.errorLogItem}>
                <Text style={styles.timestamp}>{log.timestamp}</Text>
                <Text style={styles.errorText}>{log.error}</Text>
                {log.stack && (
                  <Text style={styles.stackText} numberOfLines={3}>
                    {log.stack}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Debug Logs ({logs.length})
          </Text>
          {logs.map((log, index) => (
            <View key={`log-${index}`} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text
                  style={[
                    styles.logLevel,
                    { color: getLevelColor(log.level) },
                  ]}
                >
                  {log.level}
                </Text>
                <Text style={styles.logCategory}>{log.category}</Text>
                <Text style={styles.timestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {logs.length === 0 && errorLogs.length === 0 && (
          <Text style={styles.emptyText}>No logs available</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  clearButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#e0e0e0',
  },
  logItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  errorLogItem: {
    padding: 12,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  logHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logLevel: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 12,
  },
  logCategory: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginLeft: 'auto',
  },
  logMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
});

export default DebugLogsScreen;
