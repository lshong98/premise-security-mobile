import React from "react";
import { StyleSheet, View, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions'
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/firestore';
import * as ImageManipulator from "expo-image-manipulator";

const { height, width } = Dimensions.get('screen');

export default class PictureSignInScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      switchValue: false ,
      hasCameraPermission: null, 
      type: Camera.Constants.Type.front,
      resizedPhoto: null, 
      photo: null,
      image: null,
      uploading: false,
      signedIn: false
    }
  } 

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({hasCameraPermission: status === 'granted'});
    if(props.route.params.from === 'EZSignIn'){
      this.checkIfPersonAlreadySignedIn();
    }
  }

  checkIfPersonAlreadySignedIn = async () => {
    const { navigation } = this.props;
    let companyExist = navigation.getParam('companyName');
    let personExist = navigation.getParam('personName');

    await firebase.firestore()
      .collection('Entries')
      .where("name", "==", personExist)
      .where("company", "==", companyExist)
      .where("sign_out_time", "==", "")
      .where('premise', '==', global.premiseLocation)
      .get()
      .then(snapshot => {
        if(!snapshot.empty){
          this.setState({signedIn: true})
        }
      })
  }


  submitData = async () => {
    const { navigation } = this.props;
    let isVisitor = navigation.getParam('isVisitor')

    let company = navigation.getParam('companyName')
    let name = navigation.getParam('personName')
    let contactNo = navigation.getParam('contactNo')
    let noOfPeople = navigation.getParam('noOfPeople')
    let visitPurpose = navigation.getParam('visitPurpose')
    let personMeeting = navigation.getParam('personMeeting')
    let personDepartment = navigation.getParam('personDepartment')
    let walkinArea = navigation.getParam('walkinArea')

    if(!this.state.signedIn){
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
        sign_in_photo: this.state.image,
        sign_out_time: '',
        sign_out_photo: '',
        isVisitor: isVisitor
      })
      .then(() => {
        if(navigation.getParam('from') === 'EZSignIn'){
          firebase.firestore()
          .collection("EZSignIns")
          .doc(navigation.getParam('id'))
          .delete();
        }
        let counterRef = firebase.firestore().collection('Counters').doc('Entries');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        this.props.navigation.navigate('HomeSignOut')
      }, (error) => {
        console.log(error)
      })
    }else{
      if(navigation.getParam('from') === 'EZSignIn'){
        firebase.firestore()
        .collection("EZSignIns")
        .doc(navigation.getParam('id'))
        .delete();
      }
      this.props.navigation.navigate('HomeSignOut')
      alert("You are already signed-in.")
    }
  }

  submitImage = async () => {
    if(this.state.photo == null){
      Alert.alert('Please take a photo first')
    } else { 
      this.setState({uploading: true})
      try {
        let uploadUrl = await uploadImageAsync(this.state.resizedPhoto);
        this.setState({ image: uploadUrl });
      } catch (e) {
        console.log(e);
        alert('Upload failed, please check your internet connection or try again');
      } finally {
        if(this.state.image !== null){
          this.submitData();}
      }
    }
  };

  cameraFlip = () => {
    this.setState({
      type:
        this.state.type === Camera.Constants.Type.back
          ? Camera.Constants.Type.front
          : Camera.Constants.Type.back,
    });
  };

  resizePhoto = async (photo) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      photo,
      [{flip: ImageManipulator.FlipType.Horizontal}, {resize: {width: 250, height: 250} }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPG }
    );
    this.setState({resizedPhoto: manipResult.uri})
  };

  cameraTakePicture = async () => {
    if(this.camera){
      await this.camera.takePictureAsync({skipProcessing: true})
      .then((capturephoto)=>{
        this.resizePhoto(capturephoto.uri)
        this.setState({photo: capturephoto.uri})
      })
    }
  }
  
  renderCamera(){
    return(
      <Camera style={{flex: 1}} type={this.state.type} ref={ref => {this.camera = ref}}> 
        <TouchableOpacity style={styles.cameraFlipDeleteButton}  onPress={this.cameraFlip}>
            <Ionicons name="ios-reverse-camera" size={50} color="white" />
        </TouchableOpacity>
      </Camera>
    );
  }
  renderImage(){
    return(
      <ImageBackground resizeMode='cover' style={{flex: 1, transform: [{scaleX: -1}]}} source={{uri: this.state.photo}}>
        <TouchableOpacity style={styles.cameraFlipDeleteButton} onPress={() => this.setState({ photo: null })}>
            <Ionicons name="ios-close" size={50} color="white" />
        </TouchableOpacity>
      </ImageBackground> 
    )
  }


  render(){
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View></View>;
    } else if (hasCameraPermission === false) {
      return (
        <View style={styles.container}>
          <Text style={{textAlign: 'center'}}>No access to camera</Text>
          <View style={{position: 'absolute', bottom: 20 , left: 20}}>
            <Button style={{alignSelf: 'flex-start'}} buttonColor={"#2F465B"} mode="contained" onPress={() => this.props.navigation.navigate('SignInCompany')}>
              BACK
            </Button>
          </View>
        </View>
      );
    } else {
      return(
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>PLEASE CONFIRM YOUR IDENTITY BY TAKING A PHOTO</Text>
          </View>
          
          <View style={styles.cameraContainer}>
            {(this.state.photo == null) ? this.renderCamera() : this.renderImage()}
          </View>
          <View style={styles.cameraTakePictureButton}>
            <Button buttonColor={"#2F465B"} mode="contained" onPress={() => {(this.state.photo == null) ? this.cameraTakePicture() : null}}>
              CLICK TO TAKE PICTURE
            </Button>
          </View>
          
          <View style={styles.buttonVerticalContainer}>
            <View style={styles.buttonHorizontalContainer}>
              <View style={styles.buttonContainer}>
                <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() => 
                  this.props.navigation.goBack()}>
                  BACK
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() => 
                  this.submitImage()} disabled={this.state.uploading}>
                  {this.state.uploading ? 'SIGNING IN' : 'SIGN IN'} 
                </Button>
              </View>
            </View>
          </View>
        </View>
      );
    }
  }

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