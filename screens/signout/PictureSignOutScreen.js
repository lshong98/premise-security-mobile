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

const { width } = Dimensions.get('screen');

export default function PictureSignOutScreen({navigation, route}){
  const [cameraFacing, setCameraFacing] = useState('front');
  const [resizedPhoto, setResizedPhoto] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  // constructor(props){
  //   super(props);
  //   this.state = {
  //     hasCameraPermission: null,
  //     type: Camera.Constants.Type.front,
  //     photo: null,
  //     resizedPhoto: null,
  //     uploading: false,
  //     image: null,
  //   }
  // }

  // async componentDidMount() {
  //   const { status } = await Camera.requestCameraPermissionsAsync();
  //   this.setState({ hasCameraPermission: sta tus === 'granted' });
  // }

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
    } else {
      setUploading(true);
      try {
        let uploadUrl = await uploadImageAsync(resizedPhoto);
        await submitData(uploadUrl);
      } catch (e) {
        console.log(e);
        alert('Upload failed, please check your internet connection or try again');
      } finally {
        setUploading(false);
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
  // renderCamera(){
  //   return(
  //     <Camera style={{flex: 1}} type={this.state.type} ref={ref => {this.camera = ref}}>
  //       <TouchableOpacity style={styles.cameraFlipDeleteButton}  onPress={this.cameraFlip}>
  //           <Ionicons name="camera" size={50} color="white" />
  //       </TouchableOpacity>
  //     </Camera>
  //   );
  // }
  // renderImage(){
  //   return(
  //     <ImageBackground resizeMode='cover' style={{flex: 1, transform: [{scaleX: -1}]}} source={{uri: this.state.photo}}>
  //       <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={() => this.setState({ photo: null })}>
  //           <Ionicons name="close-outline" size={50} color="white" />
  //       </TouchableOpacity>
  //     </ImageBackground>
  //   )
  // }

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
    .child('entries/' + uuidv4() + '.jpg');
    const snapshot = await ref.put(blob, {cacheControl: 'private, max-age=7200', contentType: 'image/jpg'});

  blob.close();

  return await snapshot.ref.getDownloadURL();
}
