import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Alert, Platform } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import DropDownPicker from '../../components/react-native-dropdown-picker/src/index';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import * as ImageManipulator from "expo-image-manipulator";
import * as SMS from 'expo-sms';

const { height, width } = Dimensions.get('screen');

export default function IncidentReportScreen ({navigation}) {
  const [photo, setPhoto] = useState(null);
  const [resizedPhoto, setResizedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [incident, setIncident] = useState('Kebakaran');
  const [incident2, setIncident2] = useState('');
  const [incidentArea, setIncidentArea] = useState('');
  const [smsRecipients, setSmsRecipients] = useState([]);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    if(permission && permission.granted){
      let premise = global.premiseLocation;
      if(premise.includes("(")){
        premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
      }
      firebase.firestore()
          .collection('Accounts')
          .where('role', 'in', ['Admin', 'Master-Admin'])
          .where('premises', 'array-contains', premise)
          .get()
          .then((snapshot) => {
            const admins = snapshot.docs.map((doc) => doc.data().contact_no);
            setSmsRecipients(admins);
          });
    }
  },[permission]);

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const resizePhoto = async (uri) => {
    const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{resize: {width: 500, height: 500} }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    setResizedPhoto(manipResult.uri);
  };

  const cameraTakePicture = async () => {
    if(cameraRef.current){
      const photoData  = await cameraRef.current.takePictureAsync({skipProcessing: true});
      setPhoto(photoData .uri);
      await resizePhoto(photoData .uri);
    }
  };

  const sendIncidentSMS = async (incident, area) => {
    if (smsRecipients.length === 0) {
      Alert.alert("No recipients are selected.");
      return;
    }
    const body = "INCIDENT REPORT at " + global.premiseLocation + " " + area + ": " + incident + ". Reported by: " +  global.currentGuardOnDuty + ".";
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("SMS is not available on this device.");
      return false;
    }
    try {
      const { result } = await SMS.sendSMSAsync(smsRecipients, body);
      if (result === "sent") {
        Alert.alert("SMS successfully sent.");
        return true;
      } else if (result === "cancelled") {
        Alert.alert("SMS sending cancelled.");
        return false;
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      Alert.alert("An error occurred while sending SMS.");
      return false;
    }
  }

  const submitData = async () => {
    if (!photo) {
      Alert.alert('Please take a photo first');
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await uploadImageAsync(resizedPhoto);

      let premise = global.premiseLocation;
      if (premise.includes("(")) {
        premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
      }
      if (incident === 'Lain-lain') {
        await firebase.firestore()
            .collection('Incidents')
            .add({
              category: incident2,
              incident_area: incidentArea,
              date: firebase.firestore.Timestamp.fromDate(new Date()),
              photo: uploadUrl,
              premise: premise,
              guard_name: global.currentGuardOnDuty
            });
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        await counterRef.update({"counter": firebase.firestore.FieldValue.increment(1)});
        alert('Report successfully submitted')
        await sendIncidentSMS(incident2, incidentArea)
        navigation.navigate('GuardHome')
      } else {
        await firebase.firestore()
            .collection('Incidents')
            .add({
              category: incident,
              incident_area: incidentArea,
              date: firebase.firestore.Timestamp.fromDate(new Date()),
              photo: uploadUrl,
              premise: premise,
              guard_name: global.currentGuardOnDuty
            });
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        await counterRef.update({"counter": firebase.firestore.FieldValue.increment(1)});
        alert('Report successfully submitted')
        await sendIncidentSMS(incident, incidentArea)
        navigation.navigate('GuardHome')
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Failed to submit incident');
    } finally {
      setUploading(false);
    }
  }

  // const submitOfflineData = () => {
  //   let premise = global.premiseLocation;
  //   if(premise.includes("(")){
  //     premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
  //   }
  //
  //   if(incident === 'Lain-lain'){
  //     firebase.firestore()
  //         .collection('Incidents')
  //         .add({
  //           category: incident2,
  //           incident_area: incidentArea,
  //           date: firebase.firestore.Timestamp.fromDate(new Date()),
  //           photo: "",
  //           premise: premise,
  //           guard_name: global.currentGuardOnDuty
  //         }).then(() => {
  //       let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
  //       counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
  //     }).catch(error => {
  //       Alert.alert(error)
  //     })
  //     sendIncidentSMS(incident2, incidentArea)
  //     alert('(Offline) Report sucessfully submitted')
  //     this.props.navigation.navigate('GuardHome')
  //   } else {
  //     firebase.firestore()
  //         .collection('Incidents')
  //         .add({
  //           category: incident,
  //           incident_area: incidentArea,
  //           date: firebase.firestore.Timestamp.fromDate(new Date()),
  //           photo: "",
  //           premise: premise,
  //           guard_name: global.currentGuardOnDuty
  //         }).then(() => {
  //       let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
  //       counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
  //     }).catch(error => {
  //       Alert.alert(error)
  //     })
  //     sendIncidentSMS(incident, incidentArea)
  //     alert('(Offline) Report sucessfully submitted')
  //     this.props.navigation.navigate('GuardHome')
  //   }
  // }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to use the camera</Text>
          <Button onPress={requestPermission}>Grant Permission</Button>
        </View>
    );
  }

  return(
      <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
          {(global.internetConnectivity) ? <View style={styles.cameraContainer}>
            {photo ? (
              <ImageBackground resizeMode='cover' style={{flex: 1}} source={{uri: photo}}>
                <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={() => setPhoto(null)}>
                  <Ionicons name="close" size={50} color="white" />
                </TouchableOpacity>
              </ImageBackground>
            ): (
              <CameraView style={{flex: 1}} facing={cameraFacing} ref={cameraRef}>
                <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={toggleCameraFacing}>
                  <Ionicons name="camera" size={50} color="white" />
                </TouchableOpacity>
              </CameraView>
            )}
          </View> : null}
          {(global.internetConnectivity) ? <View style={styles.cameraTakePictureButton}>
            <Button buttonColor={'rgb(21, 31, 53)'} mode="contained" onPress={() => {(photo === null) ? cameraTakePicture() : null}}>
              CLICK TO TAKE PICTURE
            </Button>
          </View> : null}

          <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 4000} : {...styles.dropdownContainer}}>
            <Text style={styles.inputLabel}>Incident Details: </Text>
            <DropDownPicker
                items={[
                  {label: 'Kebakaran', value: 'Kebakaran'},
                  {label: 'Kes curi', value: 'Kes curi'},
                  {label: 'Tumpahan', value: 'Tumpahan'},
                  {label: 'Masalah elektrik', value: 'Masalah elektrik'},
                  {label: 'Alarm berbunyi', value: 'Alarm berbunyi'},
                  {label: 'Gangguan orang luar', value: 'Gangguan orang luar'},
                  {label: 'Pergaduhan antara pekerja', value: 'Pergaduhan antara pekerja'},
                  {label: 'Kerosakan Harta', value: 'Kerosakan Harta'},
                  {label: 'Lain-lain', value: 'Lain-lain'},
                ]}
                containerStyle={styles.dropdown}
                value={incident}
                onChangeValue={(value) => {
                  setIncident(value)
                }}
            />
          </View>
          {incident === 'Lain-lain' ?
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Please specify the incident.</Text>
                <TextInput
                    label={false}
                    mode='outlined'
                    style={styles.inputTextField}
                    value={incident2}
                    onChangeText={text => setIncident2(text)}
                    required
                />
              </View> : null}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location found at: </Text>
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={incidentArea}
                onChangeText={text => setIncidentArea(text)}
                placeholder='e.g. Behind Building A'
                required
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Guard name: </Text>
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={global.currentGuardOnDuty}
                editable={false}
                required
            />
          </View>

          <View style={styles.buttonVerticalContainer}>
            <View style={styles.buttonHorizontalContainer}>
              <View style={styles.buttonContainer}>
                <Button style={styles.buttonText} buttonColor={'rgb(21, 31, 53)'} mode="contained" onPress={() =>
                    navigation.goBack()}>
                  BACK
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button
                    style={styles.buttonText}
                    buttonColor={'rgb(21, 31, 53)'}
                    mode="contained"
                    disabled={uploading}
                    onPress={submitData}
                >
                  SUBMIT REPORT
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
  },

  headerContainer:{
    justifyContent: 'center',
    backgroundColor: '#2F465B',
    height: 60,
    width
  },
  headerTitle:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 20,
  },

  cameraContainer: {
    alignSelf: 'center',
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'gray',
    marginVertical: 20
  },
  cameraFlipDeleteButton: {
    flexDirection: 'row-reverse',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  cameraTakePictureButton: {
    alignSelf: 'center',
  },


  inputContainer:{
    marginTop: 30,
    alignSelf: 'center'
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'roboto-regular',
    fontWeight: 'bold'
  },
  inputTextField:{
    width: width * 0.8,
    height: 40,
    backgroundColor: 'white'
  },
  dropdown:{
    marginTop: 5,
    height: 40,
    width: '100%',
    flex: 1,
  },
  dropdownContainer:{
    marginTop: 30,
    alignSelf: 'center',
    width: width*0.8
  },

  buttonVerticalContainer:{
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 50,
    marginBottom: 20
  },
  buttonHorizontalContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: "wrap",
    justifyContent: 'space-between',
  },
  buttonContainer:{
    marginVertical: 15,
    marginHorizontal: 15,
    justifyContent: 'flex-end'
  },
  buttonText: {
    justifyContent: 'center'
  }
})

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


async function uploadImageAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      console.log(e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  const ref = firebase
      .storage()
      .ref()
      .child('incidents/' + uuidv4() + '.jpg');
  const snapshot = await ref.put(blob);

  blob.close();

  return await snapshot.ref.getDownloadURL();
}