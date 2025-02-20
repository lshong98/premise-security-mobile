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
      open: false,
      selectedLocation: null,
      locationList: [],
      isLoading: true,
      error: null
    }
    this.netInfoUnsubscribe = null;
  }

  async componentDidMount(){
    this._isMounted = true;
    this.netInfoUnsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
    await this.fetchLocations();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }

  handleConnectivityChange = async (state) => {
    if (!this._isMounted) return;
    
    try {
      if (state.isConnected && state.isInternetReachable) {
        await this.fetchLocations();
      } else {
        await this.loadOfflineLocations();
      }
    } catch (error) {
      console.error('Connectivity change error:', error);
      await this.loadOfflineLocations();
    }
  }

  fetchLocations = async () => {
    if (!this._isMounted) return;

    try {
      const snapshot = await firebase.firestore()
        .collection('Premises')
        .get();

      if (!this._isMounted) return;

      const allLocations = [];
      const allLocationsForGlobal = [];

      snapshot.docs.forEach(doc => {
        const name = doc.data().name;
        allLocations.push({label: name, value: name});
        allLocationsForGlobal.push(name);
      });

      await AsyncStorage.setItem('allpremises', JSON.stringify(allLocationsForGlobal));
      await AsyncStorage.setItem('premise', JSON.stringify(allLocations));
      
      if (this._isMounted) {
        this.setState({
          locationList: allLocations,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Firebase error:', error);
      if (this._isMounted) {
        this.setState({ error: error.message });
        await this.loadOfflineLocations();
      }
    }
  }

  loadOfflineLocations = async () => {
    if (!this._isMounted) return;

    try {
      const asyncLocations = await AsyncStorage.getItem('premise');
      if (this._isMounted) {
        this.setState({
          locationList: asyncLocations ? JSON.parse(asyncLocations) : [],
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error loading offline locations:', error);
      if (this._isMounted) {
        this.setState({
          locationList: [],
          isLoading: false,
          error: 'Failed to load locations. Please try again.'
        });
      }
    }
  }

  submitLocation = () => {
    const { selectedLocation } = this.state;
    if (selectedLocation) {
      this.props.navigation.navigate('Login', { selectedLocation });
    } else {
      Alert.alert(
        'Location Required',
        'Please select a branch or check your internet connection',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  }

  render(){
    const { open, selectedLocation, locationList, isLoading, error } = this.state

    return (
      <Block style={{flex: 1, width: '100%'}}>
          <ImageBackground source={require('../../assets/images/location_bg.png')} resizeMode="cover" style={styles.background}>
            <Block style={styles.backgroundDim} >
              <Image style = {styles.logo} source={require('../../assets/images/logo.png')}/>
              <Text style={styles.description} size={32}>Trienekens</Text>
              <Text style={styles.description} size={32}>Premise Security App</Text>
              <Text style={styles.description} size={18}>"Your Trusted Partner in Environmental Management"</Text>
            </Block>
          </ImageBackground>
        <Block center style={{ flex: 1, width: '100%', flexDirection: 'row', justifyContent:'flex-end' }}>
          <Block style={{flex: 1, width: '100%', marginHorizontal: 40}}>
            <DropDownPicker
                open={open}
                value={selectedLocation}
                items={locationList || []}
                setOpen={(open) => this.setState({ open })}
                setValue={(callback) => {
                  const value = callback(selectedLocation);
                  console.log('Selected location:', value);
                  this.setState({ selectedLocation: value });
                }}
                setItems={(items) => this.setState({ locationList: items })}
                containerStyle={{height: 40}}
                dropDownMaxHeight={120}
                placeholder="Select Trienekens Premise"
                loading={isLoading}
                searchable={false}
            />
          </Block>
          <Button style={styles.submitButton} onPress={() => this.submitLocation()}>
            <Text style={{ fontFamily: 'roboto-bold', color: 'gray',  }} size={16} center>NEXT </Text>
          </Button>
        </Block>
        {error && (
          <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
        )}
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
