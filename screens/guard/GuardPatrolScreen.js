import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Dimensions, Alert } from 'react-native';
import {Button, Text} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const { height, width } = Dimensions.get('screen');

export default function GuardPatrolScreen ({navigation}) {
  const [read, setRead] = useState(false);
  const [coords, setCoords] = useState('');
  const [cameraFacing, setCameraFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupPermissions = async () => {
      setIsLoading(true);
      await getLocationPermission();
      await getCameraPermission();
      setIsLoading(false);
    };

    setupPermissions();
  }, []);

  const getLocationPermission = async() => {
    try {
      const {status} = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({enableHighAccuracy: true});
        const coordsString = `${location.coords.latitude}, ${location.coords.longitude}`;
        setCoords(coordsString);
      } else {
        Alert.alert('No location access. Go to settings to manually enable them')
        navigation.goBack()
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
      setHasLocationPermission(false);
    }
  }

  const getCameraPermission = async () => {
    const { granted } = await requestCameraPermission();
    setHasCameraPermission(granted);

    if (!granted) {
      Alert.alert('Camera Permission', 'Camera access is required for this feature.');
      navigation.goBack();
    }
  };

  const handleBarCodeScanned = async ({type, data}) => {
    if (read) return;
    setRead(true);

    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    const patrolData = {
      area: data,
      premise: premise,
      patrol_time: firebase.firestore.Timestamp.fromDate(new Date()),
      name: global.currentGuardOnDuty,
      coords: coords
    };

      try{
        await firebase.firestore()
        .collection('Patrols')
        .add(patrolData);

        let counterRef = firebase.firestore().collection('Counters').doc('Patrols');
        await counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        navigation.navigate('GuardHome')
        alert(`Completed ${data}'s patrol!`);
      } catch (e) {
        console.log(`error ${e}`);
        Alert.alert('Error', 'Failed to record patrol data. Please try again.');
      } finally {
        setRead(false);
      }
  };

  if (isLoading) {
    return (
        <View style={styles.centered}>
          <ActivityIndicator color='rgb(21, 31, 53)' size="large" />
          <Text style={styles.loadingText}>Setting up...</Text>
        </View>
    );
  }

  if (!hasCameraPermission || !hasLocationPermission) {
    return (
        <View style={styles.centered}>
          <Text style={styles.message}>Camera or Location permission not granted</Text>
        </View>
    );
  }

  if(coords === '') {
    return (
      // <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
      //   <View style={{}}>
      //     <ActivityIndicator color='rgb(21, 31, 53)' size="large"/>
      //   </View>
      //   <View style={{textAlign: 'center'}}>
      //     <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> Fetching location... </Text>
      //   </View>
      // </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color='rgb(21, 31, 53)' size="large" />
          <Text style={{ color: '#979797', fontSize: 18, paddingTop: 20 }}> Fetching location... </Text>
        </View>
    );
  }

  return(
    <View style={styles.container} >
      <View style={styles.qrcode}>
        <CameraView
            style={styles.qrcode}
            onBarcodeScanned={read ? undefined : handleBarCodeScanned}
        >
          <View style={styles.layerTop} />
          <View style={styles.layerCenter}>
            <View style={styles.layerLeft} />
            <View style={styles.focused} />
            <View style={styles.layerRight} />
          </View>
          <View style={styles.layerBottom} />
        </CameraView>
      </View>
      <View style={styles.infocontainer}>
        <MaterialCommunityIcons name="qrcode-scan" size={50} />
        <Text style={styles.instructions}>Scan the QR Code to confirm patrol of the area!</Text>
      </View>
    </View>
  );
}

const opacity = 'rgba(0, 0, 0, .6)';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column'
  },
  qrcode: {
    flex: 8
  },
  infocontainer: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  layerTop: {
    flex: 1,
    backgroundColor: opacity
  },
  layerCenter: {
    flex: 3,
    flexDirection: 'row'
  },
  layerLeft: {
    flex: 1,
    backgroundColor: opacity
  },
  focused: {
    flex: 8
  },
  layerRight: {
    flex: 1,
    backgroundColor: opacity
  },
  layerBottom: {
    flex: 1,
    backgroundColor: opacity
  },

  instructions: {
    fontSize: 20,
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: 'bold',
    marginLeft: 20
  }
});
