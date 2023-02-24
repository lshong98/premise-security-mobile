import React from 'react';
import { StyleSheet, View, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const { height, width } = Dimensions.get('screen');

export default class GuardPatrolScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      hasCameraPermission: null,
      hasLocationPermission: null,
      read: false,
      coords: ''
    }
  } 

  async componentDidMount() {
    this.getLocationPermission()
  }

  getLocationPermission = async() => {
    const { status, permissions } = await Permissions.askAsync(Permissions.LOCATION);

    if (status === 'granted') {
      this.getCameraPermission()
      let location = await Location.getCurrentPositionAsync({enableHighAccuracy: true});
      const coords = location.coords.latitude + ", " + location.coords.longitude
      this.setState({coords: coords})
    } else {
      Alert.alert('No location access. Go to settings to manually enable them')
      this.props.navigation.goBack()
    }
  }

  getCameraPermission = async() => {
    const { status, permissions } = await Permissions.askAsync(Permissions.CAMERA);

    if (status !== 'granted') {
      Alert.alert('No camera access. Go to settings to manually enable them')
      this.props.navigation.goBack()
    }
  }

  delay(time) {
    return new Promise(function(resolve, reject) {
      setTimeout(() => resolve(), time);
    });
  }

  handleBarCodeScanned = async e => {
      this.setState({read: true});

      let premise = global.premiseLocation;
      if(premise.includes("(")){
        premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
      }

      try{
        await firebase.firestore()
        .collection('Patrols')
        .add({
          area: e.data,
          premise: premise,
          patrol_time: firebase.firestore.Timestamp.fromDate(new Date()),
          name: global.currentGuardOnDuty,
          coords: this.state.coords
        })
        .then(() => {
          let counterRef = firebase.firestore().collection('Counters').doc('Patrols');
          counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
          this.props.navigation.navigate('GuardHome')
          alert(`Completed ${e.data}'s patrol!`);
        }, (error) => {
          console.log(error)
        })
      } catch (e) {
        console.log(`error ${e}`)
      }
  };

  handleBarCodeScannedOffline = async e => {
      this.setState({read: true});

      let premise = global.premiseLocation;
      if(premise.includes("(")){
        premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
      }

      try{
        await firebase.firestore()
        .collection('Patrols')
        .add({
          area: e.data,
          premise: premise,
          patrol_time: firebase.firestore.Timestamp.fromDate(new Date()),
          name: global.currentGuardOnDuty,
          coords: this.state.coords
        }).then(() => {
          let counterRef = firebase.firestore().collection('Counters').doc('Patrols');
          counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        }).catch(error => {
          Alert.alert(error)
        })
        this.props.navigation.navigate('GuardHome')
        alert(`Completed ${e.data}'s patrol!`);
      } catch (e) {
        console.log(`error ${e}`)
      }
  };

  render(){
    if (this.state.coords === '') {
      return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <View style={{}}>
            <ActivityIndicator color='rgb(21, 31, 53)' size="large"/>
          </View>
          <View style={{textAlign: 'center'}}>
            <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> Fetching location... </Text>
          </View>
        </View>
      );
    } else {
        return(
          <View style={styles.container} >
            <View style={styles.qrcode}>
            <BarCodeScanner
              onBarCodeScanned={(e) => {
                if(global.internetConnectivity && this.state.read == false){
                  this.handleBarCodeScanned(e)
                } else if (this.state.read == false){
                  this.handleBarCodeScannedOffline(e)
                }
              }}
              style={[StyleSheet.absoluteFillObject, styles.container]}
            >
              <View style={styles.layerTop} />
              <View style={styles.layerCenter}>
                <View style={styles.layerLeft} />
                <View style={styles.focused} />
                <View style={styles.layerRight} />
              </View>
              <View style={styles.layerBottom} />
            </BarCodeScanner>
            </View>
            <View style={styles.infocontainer}>
              <MaterialCommunityIcons name="qrcode-scan" size={50} />
              <Text style={styles.instructions}>Scan the QR Code to confirm patrol of the area!</Text>
            </View>
          </View>
        );
    }
    
  }
  
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