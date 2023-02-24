import React, {useCallback, useEffect, useState} from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, LogBox, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font'

import { Text, View } from 'react-native';


import HomeNavigation from './navigation/HomeNavigation';
import AuthNavigation from './navigation/AuthNavigation';
import ApiKeys from './constants/ApiKeys';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {decode, encode} from 'base-64'
import _ from 'lodash';
if (!global.btoa) {  global.btoa = encode }
if (!global.atob) { global.atob = decode }

LogBox.ignoreLogs(['Setting a timer']);

export default function App(){
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [isAuthenticationReady, setIsAuthenticationReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const HomeNavigationComponent = HomeNavigation();
  const AuthNavigationComponent = AuthNavigation();

  useEffect(()=>{
    async function prepare() {
      try{
        await Font.loadAsync({
          'open-sans-regular': require('./assets/fonts/OpenSans-Regular.ttf'),
          'roboto-regular': require('./assets/fonts/Roboto-Regular.ttf'),
          'roboto-light': require('./assets/fonts/Roboto-Light.ttf'),
          'roboto-bold': require('./assets/fonts/Roboto-Bold.ttf'),
          'segoe-ui': require('./assets/fonts/SegoeUI.ttf'),
          'segoe-ui-bold': require('./assets/fonts/SegoeUI-Bold.ttf'),
        });
        setIsLoadingComplete(true);

        if(!firebase.apps.length){
          firebase.initializeApp(ApiKeys.firebaseConfig);
        }
        firebase.auth().onAuthStateChanged(onAuthStateChanged);
      }catch(e){
        console.warn(e)
      }
    }

    prepare();
  }, [])

  const onAuthStateChanged = (user) => {
    setIsAuthenticationReady(true);
    if (user != null) {
      firebase
        .firestore()
        .collection('Accounts')
        .doc(user.email)
        .get()
        .then((doc) => {
          if (doc.data().mobileapp_permission) {
            setIsAuthenticated(user);
          } else {
            Alert.alert(
              'User does not have permission to access the mobile app.'
            );
            firebase.auth().signOut();
          }
        });
    } else {
      setIsAuthenticated(null);
    }
  };

  const insets = useSafeAreaInsets();

  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete && isAuthenticationReady) {
      await SplashScreen.hideAsync();
    }
  }, [isLoadingComplete, isAuthenticationReady]);

  if (!isLoadingComplete || !isAuthenticationReady) {
    return null;
  }



    return (
      <SafeAreaProvider>
        <NavigationContainer onReady={onLayoutRootView}>
            {
            (isAuthenticated || (firebase.auth().currentUser != null)) ? 
                <HomeNavigationComponent /> 
            
            : <AuthNavigationComponent /> 
            }
        </NavigationContainer>
      </SafeAreaProvider>      
    );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
