# Debug Tools Integration Guide

## Quick Start - Add Debug Menu to Your App

The easiest way to enable users to send logs is to add the Debug Menu component.

### Option 1: Add to Main App Component (Recommended)

This makes the debug menu available on all screens.

**File:** [App.js](App.js)

Add the import at the top:
```javascript
import DebugMenu from './components/DebugMenu';
```

Add the component inside your ErrorBoundary (before the closing tag):
```javascript
return (
  <ErrorBoundary>
    <NavigationContainer theme={theme} style={styles.container} onReady={onLayoutRootView}>
      {(isAuthenticated || (firebase.auth().currentUser != null))
        ? <HomeNavigationComponent />
        : <AuthNavigationComponent />
      }
    </NavigationContainer>

    {/* Add this line */}
    <DebugMenu visible={true} />
  </ErrorBoundary>
);
```

### Option 2: Add to Specific Screen

Add to any screen where you want debug access (e.g., Settings screen):

```javascript
import React from 'react';
import { View } from 'react-native';
import DebugMenu from '../components/DebugMenu';

const SettingsScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Your settings content */}

      <DebugMenu visible={true} />
    </View>
  );
};
```

### Option 3: Add Debug Logs Screen to Navigation

If you want a dedicated screen for viewing logs:

1. **Find your navigation stack** (likely in `navigation/` folder)

2. **Import the screen:**
```javascript
import DebugLogsScreen from '../screens/DebugLogsScreen';
```

3. **Add to your stack:**
```javascript
// In your Stack.Navigator (probably in HomeNavigation.js or SettingsNavigation.js)
<Stack.Screen
  name="DebugLogs"
  component={DebugLogsScreen}
  options={{ title: 'Debug Logs' }}
/>
```

4. **Add a button to navigate to it** (in Settings screen):
```javascript
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('DebugLogs')}>
      <Text>View Debug Logs</Text>
    </TouchableOpacity>
  );
};
```

## What Each Component Does

### ErrorBoundary
- **Location:** [utils/ErrorBoundary.js](utils/ErrorBoundary.js)
- **What it does:** Catches app crashes and shows error screen with "Send Error Report" button
- **Already integrated:** Yes, in [App.js](App.js)

### DebugLogger
- **Location:** [utils/DebugLogger.js](utils/DebugLogger.js)
- **What it does:** Records all app activities to device storage
- **Already integrated:** Yes, in [App.js](App.js)

### DebugMenu
- **Location:** [components/DebugMenu.js](components/DebugMenu.js)
- **What it does:** Shows a floating button that users can tap 5 times to export logs
- **Integration needed:** Add to [App.js](App.js) (see Option 1 above)

### DebugLogsScreen
- **Location:** [screens/DebugLogsScreen.js](screens/DebugLogsScreen.js)
- **What it does:** Full screen to view, filter, and export logs
- **Integration needed:** Add to navigation (see Option 3 above)

## Recommended Setup

For the best debugging experience, we recommend:

1. ✅ **Keep ErrorBoundary** (already added)
2. ✅ **Keep DebugLogger** (already added)
3. ⚠️ **Add DebugMenu** to App.js - This gives users easy access to export logs
4. 🔲 **Optionally add DebugLogsScreen** to navigation - For advanced users/admins

## Testing the Integration

### Test Error Boundary:
```javascript
// Add this to any screen temporarily to trigger an error:
throw new Error('Test error');
```

You should see:
- Error screen with error message
- "Send Error Report" button (green)
- "Try Again" button (blue)

### Test Debug Menu:
1. Run the app
2. Look for small blue circle at bottom-right
3. Tap it 5 times quickly
4. Debug menu should appear with options

### Test Debug Logger:
```javascript
// Add this anywhere to test logging:
import logger from './utils/DebugLogger';

logger.info('TEST', 'This is a test log');
logger.error('TEST', 'This is a test error', { someData: 'value' });
```

Then check the logs in Debug Menu or DebugLogsScreen.

## Production vs Development

### Development Mode (__DEV__ = true)
- Shows detailed error messages
- Shows stack traces
- Debug logs are more verbose

### Production Mode (__DEV__ = false)
- Shows user-friendly error messages
- Hides technical details
- Still logs everything for later export

You can control DebugMenu visibility:
```javascript
// Only in development:
<DebugMenu visible={__DEV__} />

// Always visible (recommended during testing):
<DebugMenu visible={true} />

// Controlled by feature flag:
<DebugMenu visible={user.isAdmin || __DEV__} />
```

## For Users - Quick Reference

Print this for your users:

---

### 🆘 How to Report App Issues

**If the app crashes:**
1. Tap the green "Send Error Report" button
2. Share via email/WhatsApp to IT support

**If the app seems stuck or buggy:**
1. Find the blue circle at bottom-right of screen
2. Tap it 5 times quickly
3. Tap "Export & Send Logs"
4. Share to IT support

**Include in your report:**
- What time it happened
- What you were doing
- How often it happens

---

## Support Contact

Update this in the code to point to your actual support:

**File:** [components/DebugMenu.js](components/DebugMenu.js) (line ~67)
```javascript
Email: support@example.com
```

Change to your actual support email.

## Troubleshooting Integration

**DebugMenu not showing?**
- Check that `visible={true}` is set
- Make sure it's inside a View with `flex: 1`
- Try moving it outside NavigationContainer

**Logs not exporting?**
- Check Share permission on device
- Test with a simple Alert first
- Check AsyncStorage is working

**Error Boundary not catching errors?**
- Must wrap the component that might error
- Only catches render errors, not async errors
- Check console for error messages
