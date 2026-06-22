import React, {useState, useEffect, useRef} from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, Button } from 'react-native-paper';
import {CameraView, useCameraPermissions} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import * as ImageManipulator from "expo-image-manipulator";
import NetInfo from "@react-native-community/netinfo";

const { width } = Dimensions.get('screen');

export default function PictureSignOutScreen({navigation, route}){
  const [cameraFacing, setCameraFacing] = useState('front');
  const [resizedPhoto, setResizedPhoto] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isConnected, setIsConnected] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return unsubscribe;
  }, []);

  const submitData = (imageUrl) => {
    const docID = route.params.docID;

    firebase.firestore()
    .collection('Entries')
    .doc(docID)
    .update({
      sign_out_time: firebase.firestore.Timestamp.fromDate(new Date()),
      sign_out_photo: imageUrl,
    })
    .then(() => {
      navigation.navigate('Home')
    }, (error) => {
      Alert.alert(error)
    });
  }

  const submitImage = async () => {
    if(photo == null){
      Alert.alert('Please take a photo first')
    } else if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again',
        [
          {
            text: 'OK',
            onPress: () => {}
          }
        ],
        { cancelable: false }
      );
    } else {
      if (uploading) return; // Prevent multiple uploads
      setUploading(true);

      // Set a timeout to handle stalled uploads
      const uploadTimeout = setTimeout(() => {
        if (uploading) {
          setUploading(false);
          Alert.alert(
            'Upload Timeout',
            'The upload is taking longer than expected. Please try again.',
            [{ text: 'OK' }],
            { cancelable: false }
          );
        }
      }, 60000); // 60 second timeout

      try {
        let uploadUrl = await uploadImageAsync(resizedPhoto);
        clearTimeout(uploadTimeout);

        // Clean up photo URIs from memory after successful upload
        setPhoto(null);
        setResizedPhoto(null);

        // Get the docID exactly as passed from HomeScreen
        const docID = route.params.docID;

        if (!docID) {
          throw new Error("Document ID is undefined. Can't update Firestore document.");
        }

        await firebase.firestore()
          .collection('Entries')
          .doc(docID)
          .update({
            sign_out_time: firebase.firestore.Timestamp.fromDate(new Date()),
            sign_out_photo: uploadUrl
          });

        navigation.navigate('Home');
      } catch (e) {
        console.log("Upload error:", e);
        clearTimeout(uploadTimeout);
        setUploading(false);

        Alert.alert(
          'Upload Failed',
          'Please check your internet connection or try again: ' + e.message,
          [
            {
              text: 'OK',
              onPress: () => {}
            }
          ],
          { cancelable: false }
        );
      }
    }
  };

  const cameraFlip = () => {
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const resizePhoto = async (photo) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      photo,
      [{flip: ImageManipulator.FlipType.Horizontal}, {resize: {width: 250, height: 250} }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
    setResizedPhoto(manipResult.uri);
  };

  const cameraTakePicture = async () => {
    if(cameraRef.current){
      const photoData  = await cameraRef.current.takePictureAsync({skipProcessing: true});
      await resizePhoto(photoData.uri);
      setPhoto(photoData.uri);
    }
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to use the camera</Text>
          <View style={{position: 'absolute', bottom: 20 , left: 20}}>
            <Button style={{alignSelf: 'flex-start'}} buttonColor={"#2F465B"} mode="contained" onPress={() => navigation.goBack()}>
              BACK
            </Button>
            <Button style={{alignSelf: 'flex-end'}} mode="contained" onPress={requestPermission}>Grant Permission</Button>
          </View>
        </View>
    );
  }

  return(
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>PLEASE CONFIRM YOUR IDENTITY BY TAKING A PHOTO</Text>
      </View>

      <View style={styles.cameraContainer}>
        {(photo == null) ?
            (
                <CameraView style={{flex: 1}} facing={cameraFacing} ref={cameraRef}>
                  <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={cameraFlip}>
                    <Ionicons name="camera" size={50} color="white" />
                  </TouchableOpacity>
                </CameraView>
            ):
            (
                <ImageBackground resizeMode='cover' style={{flex: 1, transform: [{scaleX: -1}]}} source={{uri: photo}}>
                  <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={() => setPhoto(null)}>
                      <Ionicons name="close-outline" size={50} color="white" />
                  </TouchableOpacity>
                </ImageBackground>
            )
        }
      </View>
      <View style={styles.cameraTakePictureButton}>
        <Button buttonColor={"#2F465B"} mode="contained" onPress={() => {(photo == null) ? cameraTakePicture() : null}}>
          CLICK TO TAKE PICTURE
        </Button>
      </View>

      <View style={styles.buttonVerticalContainer}>
        <View style={styles.buttonHorizontalContainer}>
          <View style={styles.buttonContainer}>
            <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() =>
              navigation.goBack()}>
              BACK
            </Button>
          </View>
          <View style={styles.buttonContainer}>
            <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() =>
              submitImage()} disabled={uploading}>
              SIGN OUT
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
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


  buttonVerticalContainer:{
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 50
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
  let blob = null;
  try {
    // First check if we're connected
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      throw new Error('No internet connection. Please try again when connected.');
    }

    // Use fetch instead of XMLHttpRequest for better compatibility on Android
    try {
      const response = await fetch(uri);
      blob = await response.blob();
    } catch (fetchError) {
      // Fallback to traditional method
      blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.timeout = 30000;

        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Failed to create blob: HTTP status ${xhr.status}`));
          }
        };

        xhr.ontimeout = function() {
          reject(new Error('Network request timed out'));
        };

        xhr.onerror = function(e) {
          reject(new Error('Network request failed: ' + (e.message || 'Unknown error')));
        };

        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);

        try {
          xhr.send(null);
        } catch (sendError) {
          reject(sendError);
        }
      });
    }

    // Create a unique filename
    const filename = 'entries/' + uuidv4() + '.jpg';

    const ref = firebase
      .storage()
      .ref()
      .child(filename);

    const metadata = {
      contentType: 'image/jpeg',
      cacheControl: 'private, max-age=7200'
    };

    // Set upload retry options
    const uploadTask = ref.put(blob, metadata);

    // Wait for upload to complete
    const snapshot = await uploadTask;

    // Get the download URL
    const downloadURL = await snapshot.ref.getDownloadURL();

    // Clean up blob from memory (React Native blobs don't have .close())
    blob = null;

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    // Clean up blob on error too
    blob = null;
    throw new Error('Failed to upload image: ' + error.message);
  }
}
