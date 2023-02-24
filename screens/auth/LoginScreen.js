import React, { Component } from 'react'
import { View, KeyboardAvoidingView, StyleSheet, ImageBackground, Dimensions, 
  Platform, Alert, Image, Keyboard, TouchableWithoutFeedback } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput, Button, Text } from 'react-native-paper';
import { theme } from '../../constants';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const { height, width } = Dimensions.get('screen');
export default class LoginScreen extends Component {
  isConnected = false;
  isInternetReachable = false;
  constructor(props){
    super(props);
    this.state = {
      email: '',
      password: '',
      credentials: true,
    }
  } 

  loginRequest = async (branchLocation) => {
    NetInfo.addEventListener( async state => {
      if(this.state.email !== '' && this.state.password !== ''){
        if(state.isConnected && state.isInternetReachable){
          firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
          .then(async () => {
            await AsyncStorage.setItem('location', branchLocation)
          }, (error) => {
            Alert.alert('Invalid email or password. Please check again')
          });
        } else {
          Alert.alert('No internet connection. If you are having poor internet connection, please at least try to login with an internet connection before offline functions can be executed. ')
        }
      } else {
        Alert.alert("Please check if the email and password is filled.")
      }
    })
  }

  loginForm = () => {
    const branchLocation = this.props.route.params.selectedLocation;
    return(
      <View style={styles.formContainer}>
        <Text style={styles.labelText}>email</Text>
        <TextInput
          mode='outlined'
          value={this.state.email}
          onChangeText={text => this.setState({ email: text })}
          placeholder='enter your email'
          keyboardType='email-address'
          autoCapitalize="none"
          autoCorrect={false}
          textColor='white'
          placeholderTextColor='white'
          
          theme={{ colors: { primary: 'white',underlineColor:'transparent',background : 'transparent'}}}
        />

        <View style={{height: 20}}></View>
        <Text style={styles.labelText}>password</Text>
        <TextInput
          mode='outlined'
          defaultValue={this.state.password}
          onChangeText={(text) => {this.setState({ password: text })}}
          placeholder='enter your password'
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          textColor='white'
          placeholderTextColor='white'
          theme={{ colors: { primary: 'white',underlineColor:'transparent',background : 'transparent'}}}
        />
        
        <Button mode="contained" style = {styles.loginButton} onPress={() => this.loginRequest(branchLocation)} >
          <Text style={{ fontFamily: 'roboto-bold', color: '#fff', textAlignVertical:'center' }} size={16} center>LOG IN </Text>
        </Button>
      </View>
    ) 
  }

  render() {
    return (
      <ImageBackground source={require('../../assets/images/login_bg.jpg')} style={{width, height}}>
        <KeyboardAvoidingView style={styles.backgroundDim} behavior="padding" enabled   keyboardVerticalOffset={100}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.inner} >
                  <View style={styles.logoContainer}>
                    <Image style = {styles.logoImage} source={require('../../assets/images/logo.png')} resizeMode={'contain'} />
                    <Text style={styles.logoTitle}>Log In to Trienekens Premise Security </Text>
                  </View>
                  {this.loginForm()}
                </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    )
  }
}



const styles = StyleSheet.create({
  backgroundDim: { 
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,.7)' : 'rgba(0,0,0,.65)', 
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: width * 0.75,
    alignSelf: 'center',
    justifyContent: 'center',
    
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: { 
    height: 151, 
    width: 120
  },
  logoTitle: { 
    marginTop: 10, 
    fontFamily: 'roboto-light', 
    color: '#fff',
    fontSize: 26
  },
  formContainer: {
    marginVertical: 30,
  },
  labelText: {
    color: '#fff',  
    fontSize: 11,
  },  
  input: {
    borderRadius: 2,
    color: '#fff',
    paddingTop: 30,
    borderColor: theme.colors.gray2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hasErrors: {
    borderBottomColor: theme.colors.accent,
  },
  errorMessage: {
    color: theme.colors.accent
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 0.7,
    borderColor: '#fff',
    marginTop: 40,
    alignSelf: "flex-end",
    height: 40, 
    width: 100,
    justifyContent: 'center'
  }
})
