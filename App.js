import 'react-native-gesture-handler';
import React, {useCallback, useEffect, useState} from 'react'
import { Alert, StyleSheet, LogBox, View as RNView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font'

// Import navigation stacks
import HomeNavigation from './navigation/HomeNavigation';
import AuthNavigation from './navigation/AuthNavigation';
import ApiKeys from './constants/ApiKeys';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage'; // Import Firebase Storage
import {decode, encode} from 'base-64'
import _ from 'lodash';
if (!global.btoa) {  global.btoa = encode }
if (!global.atob) { global.atob = decode }

LogBox.ignoreLogs(['Setting a timer']);
LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreLogs(['A props object containing a "key" prop is being spread']);
// LogBox.ignoreAllLogs(); // Temporarily commented to see full errors

// Initialize Firebase at module level
if(!firebase.apps.length){
  console.log("Initializing Firebase...");
  try {
    firebase.initializeApp(ApiKeys.firebaseConfig);
    
    // Configure Firestore with appropriate settings
    const db = firebase.firestore();
    
    // Platform-specific settings
    if (Platform.OS === 'android') {
      // Android-specific settings
      db.settings({
        cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
        ignoreUndefinedProperties: true,
        merge: true // This prevents warnings
      });
      
      // Disable persistence on Android since it's causing issues
      firebase.firestore().settings({
        persistence: false
      });
      
      // Set log level for Android
      firebase.firestore.setLogLevel('error');
      
      // Configure Storage for Android
      const storage = firebase.storage();
      storage.setMaxUploadRetryTime(60000); // 60 seconds
      storage.setMaxOperationRetryTime(30000); // 30 seconds
      console.log("Firebase Storage configured for Android");
    } else {
      // iOS settings
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true
      });
    }
    
    console.log(`Firebase initialized with ${Platform.OS}-specific settings`);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

export default function App(){
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isAuthenticationReady, setIsAuthenticationReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const HomeNavigationComponent = HomeNavigation();
  const AuthNavigationComponent = AuthNavigation();

  useEffect(()=>{
    async function prepare() {
      try{
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          'open-sans-regular': require('./assets/fonts/OpenSans-Regular.ttf'),
          'roboto-regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'roboto-light': require('./assets/fonts/Roboto-Light.ttf'),
          'roboto-bold': require('./assets/fonts/Roboto-Bold.ttf'),
          'segoe-ui': require('./assets/fonts/SegoeUI.ttf'),
          'segoe-ui-bold': require('./assets/fonts/SegoeUI-Bold.ttf'),
        });
        setIsLoadingComplete(true);

        // Firebase is already initialized above, just setup auth listener
        firebase.auth().onAuthStateChanged(onAuthStateChanged);
      }catch(e){
        console.warn(e)
      }
    }

    prepare();
  }, [])

  const onAuthStateChanged = (user) => {
    if (user != null) {
      firebase
        .firestore()
        .collection('Accounts')
        .doc(user.email)
        .get()
        .then((doc) => {
          if (doc.data()?.mobileapp_permission) {
            setIsAuthenticated(user);
          } else {
            Alert.alert(
              'User does not have permission to access the mobile app.'
            );
            firebase.auth().signOut();
          }
        })
        .catch((error) => {
          console.error("Firestore error:", error);
          setIsAuthenticated(null);
        })
        .finally(() => {
          setIsAuthenticationReady(true);
        });
    } else {
      setIsAuthenticated(null);
      setIsAuthenticationReady(true);
    }
  };


  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete && isAuthenticationReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoadingComplete, isAuthenticationReady]);

  if (!isLoadingComplete || !isAuthenticationReady) {
    return (
      <RNView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* You can add a loading indicator here if you want */}
      </RNView>
    );
  }

    return (
        <NavigationContainer theme={theme} style={styles.container}  onReady={onLayoutRootView}>
            {
            (isAuthenticated || (firebase.auth().currentUser != null)) ? 
                <HomeNavigationComponent /> 
            
            : <AuthNavigationComponent /> 
            }
        </NavigationContainer>  
    );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
const theme = {
  colors: {
    background: "#fff",
  },
};