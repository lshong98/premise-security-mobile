import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Alert, Platform } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import DropDownPicker from '../../components/react-native-dropdown-picker/src/index';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import * as ImageManipulator from "expo-image-manipulator";
import * as SMS from 'expo-sms';

const { height, width } = Dimensions.get('screen');

export default function IncidentReportScreen({ navigation }) {
  const [photo, setPhoto] = useState(null);
  const [resizedPhoto, setResizedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [incident, setIncident] = useState('Kebakaran');
  const [incident2, setIncident2] = useState('');
  const [incidentArea, setIncidentArea] = useState('');
  const [smsRecipients, setSmsRecipients] = useState([]);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to use the camera</Text>
          <Button onPress={requestPermission} title="Grant Permission" />
        </View>
    );
  }

  function toggleCameraFacing() {
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const resizePhoto = async (uri) => {
    const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    setResizedPhoto(manipResult.uri);
  };

  const takePicture = async (camera) => {
    if (camera) {
      const photoData = await camera.takePhoto();
      setPhoto(photoData.uri);
      await resizePhoto(photoData.uri);
    }
  };

  const submitData = async () => {
    if (!photo) {
      Alert.alert('Please take a photo first');
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await uploadImageAsync(resizedPhoto);
      // Submit data to Firestore (example)
      firebase.firestore().collection('Incidents').add({
        category: incident === 'Lain-lain' ? incident2 : incident,
        incident_area: incidentArea,
        date: firebase.firestore.Timestamp.now(),
        photo: uploadUrl,
      });
      Alert.alert('Incident submitted successfully');
      navigation.navigate('GuardHome');
    } catch (e) {
      console.error(e);
      Alert.alert('Failed to submit incident');
    } finally {
      setUploading(false);
    }
  };

  return (
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView showsVerticalScrollIndicator={false}>
          {photo ? (
              <ImageBackground style={styles.camera} source={{ uri: photo }}>
                <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={() => setPhoto(null)}>
                  <Ionicons name="ios-close" size={50} color="white" />
                </TouchableOpacity>
              </ImageBackground>
          ) : (
              <CameraView style={styles.camera} facing={cameraFacing}>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                    <Text style={styles.text}>Flip Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                      style={styles.button}
                      onPress={() => takePicture(CameraView.getCamera())}
                  >
                    <Text style={styles.text}>Take Picture</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
          )}

          {/* Other components like DropDownPicker, TextInput, and Buttons */}
          <DropDownPicker
              items={[
                { label: 'Kebakaran', value: 'Kebakaran' },
                { label: 'Kes curi', value: 'Kes curi' },
                { label: 'Tumpahan', value: 'Tumpahan' },
                { label: 'Lain-lain', value: 'Lain-lain' },
              ]}
              containerStyle={styles.dropdown}
              value={incident}
              onChangeValue={(value) => setIncident(value)}
          />

          {incident === 'Lain-lain' && (
              <TextInput
                  mode="outlined"
                  style={styles.inputTextField}
                  placeholder="Specify the incident"
                  value={incident2}
                  onChangeText={(text) => setIncident2(text)}
              />
          )}

          <TextInput
              mode="outlined"
              style={styles.inputTextField}
              placeholder="Incident Area"
              value={incidentArea}
              onChangeText={(text) => setIncidentArea(text)}
          />

          <View style={styles.buttonVerticalContainer}>
            <Button
                buttonColor="rgb(21, 31, 53)"
                mode="contained"
                disabled={uploading}
                onPress={submitData}
            >
              Submit Incident
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    margin: 16,
  },
  camera: {
    flex: 1,
    width: width * 0.8,
    height: width * 0.8,
    alignSelf: 'center',
    marginVertical: 16,
  },
  cameraFlipDeleteButton: {
    flexDirection: 'row-reverse',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  text: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  dropdown: {
    marginVertical: 16,
    alignSelf: 'center',
    width: width * 0.8,
  },
  inputTextField: {
    marginVertical: 8,
    width: width * 0.8,
    alignSelf: 'center',
  },
  buttonVerticalContainer: {
    marginTop: 16,
    alignSelf: 'center',
  },
});

async function uploadImageAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = (e) => reject(new TypeError('Network request failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  const ref = firebase.storage().ref().child(`incidents/${uuidv4()}.jpg`);
  const snapshot = await ref.put(blob);
  blob.close();

  return await snapshot.ref.getDownloadURL();
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
