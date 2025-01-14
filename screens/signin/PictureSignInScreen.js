import React, {useState, useEffect, useRef} from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, Button } from 'react-native-paper';
import {CameraView, useCameraPermissions} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';
import * as ImageManipulator from "expo-image-manipulator";

const { width } = Dimensions.get('screen');

export default function PictureSignInScreen({navigation, route}) {
  const [cameraFacing, setCameraFacing] = useState('front');
  const [resizedPhoto, setResizedPhoto] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    if(route.params.from === 'EZSignIn'){
      checkIfPersonAlreadySignedIn();
    }
  }, []);

  const checkIfPersonAlreadySignedIn = async () => {
    const companyExist = route.params.companyName;
    const personExist = route.params.personName;

    await firebase.firestore()
      .collection('Entries')
      .where("name", "==", personExist)
      .where("company", "==", companyExist)
      .where("sign_out_time", "==", "")
      .where('premise', '==', global.premiseLocation)
      .get()
      .then(snapshot => {
        if(!snapshot.empty){
          setSignedIn(true);
        }
      })
  }

  const submitData = async (imageUrl) => {
    const isVisitor = route.params.isVisitor

    const company = route.params.companyName
    const name = route.params.personName
    const contactNo = route.params.contactNo
    let noOfPeople = route.params.noOfPeople
    let visitPurpose = route.params.visitPurpose
    let personMeeting = route.params.personMeeting
    let personDepartment = route.params.personDepartment
    let walkinArea = route.params.walkinArea
    let carPlateNo = route.params.carPlateNo

    if(!signedIn){
      if(!isVisitor){
        noOfPeople = 1
        visitPurpose = ''
        personMeeting = ''
        personDepartment = ''
        walkinArea = ''
      }

      firebase.firestore()
      .collection('Entries')
      .add({
        company: company,
        name: name,
        contact_no: contactNo,
        no_of_people: noOfPeople,
        visit_purpose: visitPurpose,
        host: personMeeting,
        host_department: personDepartment,
        walkin_area: walkinArea,
        premise: global.premiseLocation,
        sign_in_time: firebase.firestore.Timestamp.fromDate(new Date()),
        sign_in_photo: imageUrl,
        sign_out_time: '',
        sign_out_photo: '',
        isVisitor: isVisitor,
        carPlateNo: carPlateNo
      })
      .then(() => {
        if(route.params.from === 'EZSignIn'){
          firebase.firestore()
          .collection("EZSignIns")
          .doc(route.params.id)
          .delete();
        }
        const counterRef = firebase.firestore().collection('Counters').doc('Entries');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        navigation.navigate('HomeSignOut')
      }, (error) => {
        console.log(error);
      })
    }else{
      if(route.params.from === 'EZSignIn'){
        await firebase.firestore()
            .collection("EZSignIns")
            .doc(route.params.id)
            .delete();
      }
      navigation.navigate('HomeSignOut')
      alert("You are already signed-in.")
    }
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
      setPhoto(photoData .uri);
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
            <Button style={{alignSelf: 'flex-start'}} buttonColor={"#2F465B"} mode="contained" onPress={() => navigation.navigate('SignInCompany')}>
              BACK
            </Button>
            <Button style={{alignSelf: 'flex-end'}} mode="contained" onPress={requestPermission}>Grant Permission</Button>
          </View>
        </View>
    );
  }


  //
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
  //           <Ionicons name="ios-close" size={50} color="white" />
  //       </TouchableOpacity>
  //     </ImageBackground>
  //   )
  // }

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
              )
              :
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
                {uploading ? 'SIGNING IN' : 'SIGN IN'}
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
    flexDirection: 'row',
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