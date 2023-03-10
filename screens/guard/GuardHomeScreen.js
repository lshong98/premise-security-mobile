import * as React from 'react';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Text } from 'react-native-paper'
import DropDownPicker from 'react-native-dropdown-picker';
import { Block } from '../../components';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


const { height, width } = Dimensions.get('screen');
export default class GuardHomeScreen extends React.Component{
  _isConnected = false;
  _isInternetReachable = false;
  constructor(props){
    super(props);
    this.state = {
      guardsNamesList: []
    }
  } 

  async componentDidMount(){
    this._isMounted = true;
    this.getGuardsNamesList();
  }

  async getGuardsNamesList(){
    global.currentGuardOnDuty = await AsyncStorage.getItem('guardOnDuty')
    if(global.internetConnectivity){
      let guardsNamesList = [];
      firebase.firestore()
      .collection('Guards')
      .get()
      .then(snapshot => {
        if(this._isMounted){
          snapshot.docs.forEach(doc => {
            guardsNamesList.push({label: doc.data().name, value: doc.data().name})
          })

          AsyncStorage.setItem('guardsNamesList', JSON.stringify(guardsNamesList))
          this.setState({guardsNamesList: guardsNamesList})
        }
      })
    } else {
      let asyncNames = await AsyncStorage.getItem('guardsNamesList');
      this.setState({guardsNamesList: JSON.parse(asyncNames)});
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  setGuardOnDutyAsync = async (selectedGuard) => {
    global.currentGuardOnDuty = selectedGuard
    AsyncStorage.setItem('guardOnDuty', selectedGuard)
    this.forceUpdate();
  }

  guardRouteRequest = (route) => {
    if(global.currentGuardOnDuty !== null && global.currentGuardOnDuty !== ""){
      this.props.navigation.navigate(route);
    } else {
      alert(`Please select a guard`)
    }
  }

  render(){
    const { guardsNamesList } = this.state
    return(
      <View style={styles.container}>
        <Block style={Platform.OS !== 'android' ? { flex: 0, zIndex: 9998} : {flex: 0}}>
          <DropDownPicker
            items={(guardsNamesList && guardsNamesList.length > 0) ? guardsNamesList : [{label: global.currentGuardOnDuty, value: global.currentGuardOnDuty}]}
            defaultValue={global.currentGuardOnDuty}
            placeholder={'SELECT GUARD'}
            containerStyle={{height: 40}}
            onChangeItem={(item) => {
              this.setGuardOnDutyAsync(item.value)
            }}
            dropDownMaxHeight={120}
          />
          <Text style={styles.guardLabel}>Current guard on duty: </Text>
          <Text style={styles.guardName}>{global.currentGuardOnDuty}  </Text>
        </Block>

        <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
        <View style={styles.guardcontainer}>
          <Button icon="car-brake-alert" buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.guardRouteRequest('IncidentReport')} style={styles.button}>
            REPORT INCIDENT
          </Button>
          <Button icon="shield-home-outline"  buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.guardRouteRequest('GuardPatrol')} style={styles.button}>
            PATROL
          </Button>
          <Button icon="car-outline"  buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.guardRouteRequest('OutsiderVehicleRecord')} style={styles.button}>
            Outsider Vehicle
          </Button>
          <Button icon="account-box-outline" buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.guardRouteRequest('GuardActivity')} style={styles.button}>
            MY ACTIVITY
          </Button>
        </View>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginHorizontal: 60
  },
  guardcontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: "column",
    marginTop: 30,
  },
  button:{
    marginTop: 5,
    width:'100%',
  },
  testbranchTitle:{
    color: 'gray',
    textAlign: 'right',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 10,
    marginBottom: 20,
  },
  guardLabel: {
    fontSize: 15, 
    marginBottom: 5,
    marginTop: 10,
    alignSelf: 'center'
  },
  guardName: {
    fontSize: 20, 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5,
    alignSelf: 'center'
  },
  dropdown:{
    marginTop: 5, 
    height: 40, 
  },
  dropdownContainer:{
    marginBottom: 50,
    flexDirection:'column',
    alignSelf: 'center',
    justifyContent:'center',
    opacity: 0.6
  },
});

