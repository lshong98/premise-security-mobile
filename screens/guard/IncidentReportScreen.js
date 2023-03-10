import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, ImageBackground, KeyboardAvoidingView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import DropDownPicker from '../../components/react-native-dropdown-picker/src/index';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import * as ImageManipulator from "expo-image-manipulator";
import * as SMS from 'expo-sms';

const { height, width } = Dimensions.get('screen');

export default class IncidentReportScreen extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      hasCameraPermission: null, 
      type: Camera.Constants.Type.back, 
      photo: null,
      resizedPhoto: null,
      uploading: false,
      image: null,
      incident: 'Kebakaran',
      incident2: '',
      incidentArea: '',
      smsrecipients: [],
    }
  } 

  async componentDidMount() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    this.setState({ hasCameraPermission: status === 'granted' });
    this.getAdminExecutivesContact()
  }

  getAdminExecutivesContact = () => {
    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    firebase.firestore()
    .collection('Accounts')
    .where('role', 'in', ['Admin', 'Master-Admin'])
    .where('premises', 'array-contains', premise)
    .get()
    .then(snapshot => {
      let adminData = [];
      snapshot.docs.forEach(doc => {
        adminData.push(doc.data().contact_no)
      })
      this.setState({smsrecipients: adminData})
    })
  }

  sendSMS = async (incident, area) => {
    const body = "INCIDENT REPORT at " + global.premiseLocation + " " + area + ": " + incident + ". Reported by: " +  global.currentGuardOnDuty + "."; 
    const isAvailable = await SMS.isAvailableAsync();
    const recipents = [...this.state.smsrecipients];
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(recipents, body);
    } else {
      Alert.alert("SMS is not available on this device.")
    }    
  }

  submitData = () => {
    const { incident2, incident, incidentArea, image } = this.state

    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    if(this.state.incident == 'Lain-lain'){
      firebase.firestore()
      .collection('Incidents')
      .add({
        category: incident2,
        incident_area: incidentArea,
        date: firebase.firestore.Timestamp.fromDate(new Date()),
        photo: image,
        premise: premise,
        guard_name: global.currentGuardOnDuty 
      })
      .then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        this.sendSMS(incident2, incidentArea)
        this.props.navigation.navigate('GuardHome')
        alert('Report sucessfully submitted')
      }, (error) => {
        console.log(error)
      })
    } else {
      firebase.firestore()
      .collection('Incidents')
      .add({
        category: incident,
        incident_area: incidentArea,
        date: firebase.firestore.Timestamp.fromDate(new Date()),
        photo: image,
        premise: premise,
        guard_name: global.currentGuardOnDuty 
      })
      .then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        this.sendSMS(incident, incidentArea)
        this.props.navigation.navigate('GuardHome')
        alert('Report sucessfully submitted')
      }, (error) => {
        console.log(error)
      })
    }
  }

  submitOfflineData = () => {
    const { incident2, incident, incidentArea } = this.state

    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    if(this.state.incident == 'Lain-lain'){
      firebase.firestore()
      .collection('Incidents')
      .add({
        category: incident2,
        incident_area: incidentArea,
        date: firebase.firestore.Timestamp.fromDate(new Date()),
        photo: "",
        premise: premise,
        guard_name: global.currentGuardOnDuty 
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })
      this.sendSMS(incident2, incidentArea)
      alert('(Offline) Report sucessfully submitted')
      this.props.navigation.navigate('GuardHome')
    } else {
      firebase.firestore()
      .collection('Incidents')
      .add({
        category: incident,
        incident_area: incidentArea,
        date: firebase.firestore.Timestamp.fromDate(new Date()),
        photo: "",
        premise: premise,
        guard_name: global.currentGuardOnDuty 
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Incidents');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })
      this.sendSMS(incident, incidentArea)
      alert('(Offline) Report sucessfully submitted')
      this.props.navigation.navigate('GuardHome')
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
      [{resize: {width: 500, height: 500} }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
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
            <Ionicons name="camera" size={50} color="white" />
        </TouchableOpacity>
      </Camera>
    );
  }
  renderImage(){
    return(
      <ImageBackground resizeMode='cover' style={{flex: 1}} source={{uri: this.state.photo}}>
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
            <Button style={{alignSelf: 'flex-start'}} buttonColor={'rgb(21, 31, 53)'} mode="contained" onPress={() => this.props.navigation.navigate('GuardHome')}>
              BACK
            </Button>
          </View>
        </View>
      );
    } else {
      return(
        <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
          {(global.internetConnectivity) ? <View style={styles.cameraContainer}>
            {(this.state.photo == null) ? this.renderCamera() : this.renderImage()}
          </View> : null}
          {(global.internetConnectivity) ? <View style={styles.cameraTakePictureButton}>
            <Button buttonColor={'rgb(21, 31, 53)'} mode="contained" onPress={() => {(this.state.photo == null) ? this.cameraTakePicture() : null}}>
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
              onChangeItem={(item) => {
                this.setState({ incident: item.value })
              }}
            />
          </View>
          {this.state.incident == 'Lain-lain' ?
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Please specify the incident.</Text>    
            <TextInput
              label={false}
              mode='outlined'
              style={styles.inputTextField}
              value={this.state.incident2}
              onChangeText={text => this.setState({ incident2: text })}
              required
            />
          </View> : null}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Location found at: </Text>    
            <TextInput
              label={false}
              mode='outlined'
              style={styles.inputTextField}
              value={this.state.incidentArea}
              onChangeText={text => this.setState({ incidentArea: text })}
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
                  this.props.navigation.goBack()}>
                  BACK
                </Button>
              </View>
              <View style={styles.buttonContainer}>
                <Button style={styles.buttonText} buttonColor={'rgb(21, 31, 53)'} disabled={(global.internetConnectivity) ? (this.state.uploading) : false} mode="contained" onPress={() => 
                  {
                    if(global.internetConnectivity){
                      this.submitImage()
                    } else {
                      this.submitOfflineData()
                    }
                  } 
                }>
                  SUBMIT REPORT
                  
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      );
    }
  }

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