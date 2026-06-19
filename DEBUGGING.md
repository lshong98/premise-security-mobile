# Debugging Blank Screen Issue on Android

## Problem Description

Some Android users report that the app occasionally goes blank/white screen. The app returns to normal after a phone restart.

## Possible Causes

1. **Memory Issues**
   - Memory leaks causing the app to crash silently
   - Insufficient memory on the device
   - Background processes consuming resources

2. **Firebase/Firestore Issues**
   - Connection timeouts
   - Persistence cache corruption
   - Firestore operations failing silently

3. **React Native Bridge Issues**
   - Native module crashes
   - JavaScript thread blocking
   - UI thread blocking

4. **State Management Issues**
   - Auth state getting stuck
   - Navigation state corruption
   - AsyncStorage issues

5. **Android-Specific Issues**
   - Activity lifecycle issues
   - WebView memory leaks
   - Reanimated/Gesture Handler conflicts

## Debugging Tools Implemented

### 1. Error Boundary

Location: [utils/ErrorBoundary.js](utils/ErrorBoundary.js)

- Catches React component errors
- Logs errors to AsyncStorage
- Shows user-friendly error screen
- Allows recovery without restart

### 2. Debug Logger

Location: [utils/DebugLogger.js](utils/DebugLogger.js)

Features:
- Persistent logging to AsyncStorage
- Categories: APP_INIT, AUTH, FIREBASE, RENDER, MEMORY
- Log levels: DEBUG, INFO, WARN, ERROR
- Tracks app lifecycle and Firebase operations

Usage:
```javascript
import logger from './utils/DebugLogger';

logger.info('CATEGORY', 'Message', { data });
logger.error('CATEGORY', 'Error message', error);
logger.trackFirebaseOperation('operation', details);
logger.trackFirebaseError('operation', error);
```

### 3. Debug Logs Screen

Location: [screens/DebugLogsScreen.js](screens/DebugLogsScreen.js)

Features:
- View all debug logs
- Filter by log level
- Export logs for analysis
- View error boundary crashes

**To add to navigation:**
Add this screen to your settings or developer menu so users can access their logs.

## How to Reproduce the Issue

1. Ask the user to:
   - Enable the Debug Logs screen in settings
   - Use the app normally until blank screen occurs
   - Note the time when it happens
   - After restart, export the logs and send them to you

2. Look for patterns:
   - What was the last logged activity?
   - Any Firebase errors before the crash?
   - Memory warnings?
   - Specific user actions that trigger it?

## Remote Debugging Setup

### Option 1: LogCat (Android Studio)

1. Connect device via USB
2. Enable USB debugging
3. Open Android Studio > Logcat
4. Filter by package: `com.swinburne.tpsapp`
5. Look for errors/crashes

### Option 2: React Native Debugger

```bash
# Start Metro bundler
npm start

# In another terminal, enable remote debugging
adb shell input keyevent 82  # Opens dev menu
# Select "Debug" from menu
```

### Option 3: Crashlytics (Recommended for Production)

Install Firebase Crashlytics:
```bash
npm install @react-native-firebase/app @react-native-firebase/crashlytics
```

Add to App.js:
```javascript
import crashlytics from '@react-native-firebase/crashlytics';

// Log custom events
crashlytics().log('App loaded');

// Log errors
crashlytics().recordError(error);
```

## Immediate Debugging Steps

### Step 1: Add Logging to Key Components

Add logger calls in:
- Screen mount/unmount
- Firebase operations
- Navigation events
- Network requests
- AsyncStorage operations

Example:
```javascript
useEffect(() => {
  logger.info('SCREEN', 'HomeScreen mounted');
  return () => {
    logger.info('SCREEN', 'HomeScreen unmounted');
  };
}, []);
```

### Step 2: Monitor Memory Usage

Install react-native-device-info:
```bash
npm install react-native-device-info
```

Add memory tracking:
```javascript
import DeviceInfo from 'react-native-device-info';

// Check available memory periodically
setInterval(async () => {
  const totalMemory = await DeviceInfo.getTotalMemory();
  const usedMemory = await DeviceInfo.getUsedMemory();
  logger.debug('MEMORY', 'Memory usage', { totalMemory, usedMemory });
}, 60000); // Every minute
```

### Step 3: Add Global Error Handlers

Add to App.js before the App component:
```javascript
// Catch unhandled promise rejections
global.onunhandledrejection = (event) => {
  logger.error('UNHANDLED_REJECTION', 'Promise rejection', {
    reason: event.reason,
    promise: event.promise,
  });
};

// Catch global errors
ErrorUtils.setGlobalHandler((error, isFatal) => {
  logger.error('GLOBAL_ERROR', `Fatal: ${isFatal}`, {
    error: error.toString(),
    stack: error.stack,
  });

  if (isFatal) {
    Alert.alert(
      'Unexpected error occurred',
      `Error: ${error.name}\n${error.message}\n\nThe app will need to restart.`,
      [{
        text: 'Restart',
        onPress: () => {
          // You can use RNRestart here
        }
      }]
    );
  }
});
```

### Step 4: Test Blank Screen Scenarios

Try to reproduce by:
1. **Low memory simulation:**
   - Open many apps in background
   - Navigate through all screens quickly

2. **Network issues:**
   - Enable airplane mode mid-operation
   - Simulate slow network

3. **Firebase stress test:**
   - Perform many reads/writes quickly
   - Test with offline mode

4. **Long-running session:**
   - Keep app open for hours
   - Check for memory leaks

## Analyzing Exported Logs

When you receive logs from users:

1. **Look for the timeline:**
   - Find the last successful operation
   - Check what happened right before the blank screen

2. **Check for patterns:**
   - Repeated errors
   - Memory growing over time
   - Firebase timeout errors
   - State inconsistencies

3. **Firebase-specific issues:**
   - Look for: `FIREBASE_ERROR`, `FIRESTORE_TIMEOUT`
   - Check: Connection state, persistence errors

4. **Memory issues:**
   - Look for: `MEMORY` category logs
   - Check: Increasing memory usage over time

## Known Android Issues & Fixes

### Issue: Firebase Persistence Crashes
**Solution:** Disabled in App.js line 45-46
```javascript
firebase.firestore().settings({ persistence: false });
```

### Issue: Reanimated Crashes
**Solution:** Ensure proper Babel configuration
Check babel.config.js has:
```javascript
plugins: ['react-native-reanimated/plugin']
```

### Issue: Memory Leaks in Navigation
**Solution:** Properly cleanup listeners
```javascript
useEffect(() => {
  const unsubscribe = navigation.addListener('blur', () => {
    // Cleanup
  });
  return unsubscribe;
}, [navigation]);
```

## Next Steps

1. ✅ Implement Error Boundary
2. ✅ Implement Debug Logger
3. ✅ Create Debug Logs Screen
4. 🔲 Add Debug Logs Screen to navigation
5. 🔲 Add global error handlers
6. 🔲 Install Crashlytics (for production)
7. 🔲 Add memory monitoring
8. 🔲 Test with low memory scenarios
9. 🔲 Collect logs from affected users

## User Instructions - How to Send Error Logs

### Method 1: When App Crashes (Error Screen Shows)

If the app shows an error screen instead of going blank:

1. **Tap "Send Error Report" button** (green button on error screen)
2. Choose how to share:
   - Email
   - WhatsApp
   - Any messaging app
3. Send the report to your IT support team

### Method 2: Using the Hidden Debug Menu

For any issues (even if app seems fine):

1. **Activate Debug Menu:**
   - Look for a small blue circle at bottom-right of screen
   - Tap it **5 times quickly** (within 3 seconds)
   - Debug menu will appear

2. **Export Logs:**
   - Tap "Export & Send Logs"
   - Choose sharing method (email, WhatsApp, etc.)
   - Send to IT support

### Method 3: From Settings (If Added to Navigation)

If your admin has added Debug Logs to Settings:

1. Open the app
2. Go to **Settings > Debug Logs**
3. Tap **"Export"** button
4. Share via email/messaging

### What to Include When Reporting

When sending logs, please include:

1. **Time the issue occurred** (e.g., "Around 2:30 PM on Jan 15")
2. **What you were doing** (e.g., "Scanning a barcode", "Opening visitor list")
3. **Phone model** (e.g., "Samsung Galaxy S21", "Pixel 6")
4. **How often it happens** (e.g., "First time", "Happens daily")

### For Blank Screen Issue Specifically

If the app goes completely blank/white:

1. **DON'T close the app immediately** - try waiting 30 seconds first
2. If still blank, **force close** the app:
   - Android: Recent apps > Swipe away
   - Or: Settings > Apps > Premise Security > Force Stop
3. **Reopen the app**
4. **Immediately access Debug Menu** (tap blue circle 5 times)
5. **Export & send logs** before using the app again

This way, the logs will contain what happened just before the crash!

## Contact

If you need help analyzing logs or implementing fixes, consult with:
- Android native developers for native module issues
- Firebase team for Firestore-specific problems
- React Native community for framework issues
