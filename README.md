# Premise Security Mobile App

A React Native mobile application built with Expo for premise security management.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

### For iOS Development
- macOS computer
- [Xcode](https://apps.apple.com/us/app/xcode/id497799835) (latest version)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development
- [Android Studio](https://developer.android.com/studio)
- Java Development Kit (JDK) 17 or higher
- Android SDK (API 34 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd premise-security-mobile
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development Mode (Expo Go)

Start the development server:
```bash
npm start
```

This will open the Expo Developer Tools in your browser. You can then:
- Scan the QR code with the Expo Go app on your device
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator

### iOS (Development Build)

1. Install iOS dependencies:
```bash
cd ios && pod install && cd ..
```

2. Run on iOS:
```bash
npm run ios
```

Or specify a simulator:
```bash
npm run ios -- --simulator="iPhone 15 Pro"
```

### Android (Development Build)

1. Ensure you have an Android emulator running or a device connected

2. Run on Android:
```bash
npm run android
```

## Building for Production

### iOS Production Build

1. Open the project in Xcode:
```bash
open ios/PremiseSecurityMobile.xcworkspace
```

2. In Xcode:
   - Select your development team
   - Choose "Generic iOS Device" or your connected device
   - Product > Archive
   - Follow the prompts to upload to App Store Connect

### Android Production Build

1. Generate a release APK:
```bash
cd android
./gradlew assembleRelease
```

The APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

2. Generate a release AAB (for Google Play):
```bash
cd android
./gradlew bundleRelease
```

The AAB will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

## Troubleshooting

### iOS Build Issues

- Clean build folder: In Xcode, Product > Clean Build Folder
- Reset CocoaPods:
  ```bash
  cd ios
  pod deintegrate
  pod install
  cd ..
  ```

### Android Build Issues

- Clean Gradle cache:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  ```

- Reset Metro bundler cache:
  ```bash
  npm start -- --reset-cache
  ```

### General Issues

- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```

- Clear watchman cache (macOS):
  ```bash
  watchman watch-del-all
  ```

## Project Structure

- `/screens` - Application screens and UI components
- `/android` - Android native code and configuration
- `/ios` - iOS native code and configuration
- `/assets` - Images, fonts, and other static resources
- `app.json` - Expo configuration

## Debugging & Error Reporting

This app includes built-in debugging tools to help diagnose issues:

- **Error Boundary:** Catches crashes and allows users to send error reports
- **Debug Logger:** Tracks app activities for troubleshooting
- **Debug Menu:** Hidden menu for exporting logs (tap blue circle 5 times)

### For Developers
See [DEBUGGING.md](DEBUGGING.md) for detailed debugging guide and [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for setup instructions.

### For End Users
See [USER_GUIDE_ERROR_REPORTING.md](USER_GUIDE_ERROR_REPORTING.md) for instructions on reporting issues.

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## Support

For issues or questions, please contact the development team.
