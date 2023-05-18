import React, { Component } from 'react';
import { Alert, ImageBackground, Image, Dimensions, StyleSheet} from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Block, Text } from '../../components';
import DropDownPicker from 'react-native-dropdown-picker';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const { height, width } = Dimensions.get('screen');
export default class LocationScreen extends Component {
  _isMounted = false;
  constructor(props){
    super(props);
    this.state = {
      selectedLocation: '',
      locationList: []
    }
  }

  async componentDidMount (){
    this._isMounted = true;
    NetInfo.addEventListener( async state => {
      if(state.isConnected && state.isInternetReachable){
        let allLocations = [];
        let allLocationsForGlobal = []
        firebase.firestore()
        .collection('Premises')
        .get()
        .then(snapshot => { 
          if(this._isMounted){
            snapshot.docs.forEach(doc => {
              allLocations.push({label: doc.data().name, value: doc.data().name})
              allLocationsForGlobal.push(doc.data().name)
            })

            //all premise name only array for homescreen use
            AsyncStorage.setItem('allpremises', JSON.stringify(allLocationsForGlobal)) 
            //dropdown offline data 
            AsyncStorage.setItem('premise', JSON.stringify(allLocations)) 
            //dropdown data
            this.setState({locationList: allLocations}) 
          }
        })
      } else {
        let asyncLocations = await AsyncStorage.getItem('premise');
        this.setState({locationList: JSON.parse(asyncLocations)});
      }
    })
  
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  submitLocation = () => {
    const { selectedLocation } = this.state
    if(selectedLocation != '' && selectedLocation != null && selectedLocation != "Select Trienekens Premise"){
      this.props.navigation.navigate('Login', {selectedLocation: selectedLocation})
    } else {
      Alert.alert('Please select a branch or check your internet connection')
    }
  }
  
  render(){
    const { locationList } = this.state
    
    return (
      <Block style={{flex:1}}>
          <ImageBackground source={require('../../assets/images/location_bg.png')} resizeMode="cover" style={styles.background}>
            <Block style={styles.backgroundDim} >
              <Image style = {styles.logo} source={require('../../assets/images/logo.png')}/>
              <Text style={styles.description} size={32}>Trienekens</Text>
              <Text style={styles.description} size={32}>Premise Security App</Text>
              <Text style={styles.description} size={18}>"Your Trusted Partner in Environmental Management"</Text>
            </Block>
          </ImageBackground> 
        <Block center style={{ flex: 1, flexDirection: 'row', justifyContent:'flex-end' }}>
          <Block style={{flex: 1, marginHorizontal: 40}}>
            <DropDownPicker
              items={
                (locationList && locationList.length > 0) ? locationList : [{label: 'Select Trienekens Premise', value: 'Select Trienekens Premise'}]
              }
              containerStyle={{height: 40}}
              onChangeItem={item => this.setState({ selectedLocation: item.value })}
              dropDownMaxHeight={120}
            />
          </Block>
          <Button style={styles.submitButton} onPress={() => this.submitLocation()}>
            <Text style={{ fontFamily: 'roboto-bold', color: 'gray',  }} size={16} center>NEXT </Text>
          </Button>
        </Block>
      </Block>
    );
  }
}


const styles = StyleSheet.create({
  submitButton: {
    position: 'absolute',
    bottom:0,
    right:0,
    backgroundColor: 'transparent',
    marginRight: 25
  },
  background:{
    width, 
    height: height * 0.5,
    justifyContent: 'flex-end'
  },
  backgroundDim:{
    backgroundColor: 'rgba(0,0,0,0.60)', 
    flex: 1, 
    justifyContent: 'center'
  },
  logo:{
    height: 151, 
    width: 120, 
    alignSelf: 'center'
  },
  description: {
    paddingHorizontal: 10, 
    marginTop: 10, 
    fontFamily: 'roboto-light', 
    lineHeight: 30, 
    color: 'white', 
    textAlign: 'center'
  },
})