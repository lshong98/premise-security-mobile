import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Divider, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Block } from '../components';
import { Avatar } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import Modal from 'react-native-modal';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import * as SMS from 'expo-sms';

global.subscribers = [];

export let visitorSource = []
export let staffSource = []

export default function HomeScreen({ navigation }){
  const [loading, setLoading] = useState(true);
  const [visitorState, setVisitorState] = useState([]);
  const [staffState, setStaffState] = useState([]);
  const [visible, setVisible] = useState(false);
  const [alertDropdownOpen, setAlertDropdownOpen] = useState(false);
  const [alertIncident, setAlertIncident] = useState('not sign out');
  const [alertPerson, setAlertPerson] = useState('');
  const [alertPersonNo, setAlertPersonNo] = useState('');
  const [alertRecipients, setAlertRecipients] = useState([]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeNetwork;
    let unsubscribeHome;

    const loadData = async () => {
      try {
        const premises = JSON.parse(await AsyncStorage.getItem('allpremises'));
        let premiseList = [];

        premises.forEach(premise => {
          if (premise.includes("(")) {
            premise = premise.substring(0, premise.indexOf('('))
          }

          if (!premiseList.includes(premise.trim())) {
            premiseList.push(premise.trim())
          }
        })

        //global variables
        global.premiseLocation = await AsyncStorage.getItem('location');
        unsubscribeNetwork = NetInfo.addEventListener(state => {
          global.internetConnectivity = state.isConnected && state.isInternetReachable;
        });

        unsubscribeHome = firebase.firestore()
            .collection('Entries')
            .where('sign_out_time', '==', '')
            .where('premise', '==', global.premiseLocation)
            .onSnapshot(snapshot => {
              if (isMounted) {
                visitorSource = [];
                staffSource = [];

                snapshot.docs.forEach(doc => {
                  if (!doc.data().isVisitor)
                    staffSource.push({
                      id: doc.id,
                      name: doc.data().name,
                      company: doc.data().company,
                      purpose: doc.data().visit_purpose,
                      sign_in_time: doc.data().sign_in_time,
                      pic: doc.data().sign_in_photo,
                      contact_no: doc.data().contact_no
                    });
                  else
                    visitorSource.push({
                      id: doc.id,
                      name: doc.data().name,
                      company: doc.data().company,
                      purpose: doc.data().visit_purpose,
                      sign_in_time: doc.data().sign_in_time,
                      pic: doc.data().sign_in_photo,
                      contact_no: doc.data().contact_no
                    });
                });

                setVisitorState(visitorSource);
                setStaffState(staffSource);
                setLoading(false);
                sortEntries();
              }
            });
        global.subscribers.push(unsubscribeHome);
        global.subscribers.push(unsubscribeNetwork);

        getMasterAdminContact();
      } catch (e) {
        console.error("Error loading data:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (unsubscribeNetwork) unsubscribeNetwork();
      if (unsubscribeHome) unsubscribeHome();
    };
  }, []);

  // async componentDidMount(){
  //   this._isMounted = true;
  //   let premises = JSON.parse(await AsyncStorage.getItem('allpremises'));
  //   let premiseList = [];
  //
  //   premises.forEach(premise => {
  //     if(premise.includes("(")){
  //       premise = premise.substring(0, premise.indexOf('('))
  //     }
  //
  //     if(!premiseList.includes(premise.trim())){
  //       premiseList.push(premise.trim())
  //     }
  //   })
  //
  //   //global variables
  //   global.premiseLocation = await AsyncStorage.getItem('location')
  //   let unsubscribeNetwork = NetInfo.addEventListener(state => {
  //     global.internetConnectivity = state.isConnected && state.isInternetReachable;
  //   });
  //
  //   let unsubscribeHome = firebase.firestore()
  //   .collection('Entries')
  //   .where('sign_out_time', '==', '')
  //   .where('premise', '==', global.premiseLocation)
  //   .onSnapshot(snapshot => {
  //     visitorSource = [];
  //     staffSource = [];
  //
  //     if(this._isMounted){
  //       snapshot.docs.forEach(doc => {
  //         if(!doc.data().isVisitor)
  //           staffSource.push({
  //             id: doc.id,
  //             name: doc.data().name,
  //             company: doc.data().company,
  //             purpose: doc.data().visit_purpose,
  //             sign_in_time: doc.data().sign_in_time,
  //             pic: doc.data().sign_in_photo,
  //             contact_no: doc.data().contact_no})
  //         else
  //           visitorSource.push({
  //             id: doc.id,
  //             name: doc.data().name,
  //             company: doc.data().company,
  //             purpose: doc.data().visit_purpose,
  //             sign_in_time: doc.data().sign_in_time,
  //             pic: doc.data().sign_in_photo,
  //             contact_no: doc.data().contact_no})
  //       })
  //       this.setState({
  //         visitorState: visitorSource,
  //         staffState: staffSource,
  //         loading: false
  //       }, () => { this.sortEntries() })
  //     }
  //   })
  //
  //   global.subscribers.push(unsubscribeHome)
  //   global.subscribers.push(unsubscribeNetwork)
  //
  //   this.getMasterAdminContact()
  // }

  // componentWillUnmount() {
  //   this._isMounted = false;
  //   this.setState({dialog: false})
  // }

  const unsubscribeListeners = async () => {
    let itemsProcessed = 0;
    global.subscribers.forEach(subscriber => {
      subscriber();
      itemsProcessed++;
      if(itemsProcessed === global.subscribers.length){
        firebase.auth().signOut();
      }
    })
  }

  const getMasterAdminContact = () => {
    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    firebase.firestore()
    .collection('Accounts')
    .where('role', '==', 'Master-Admin')
    .where('premises', 'array-contains', premise)
    .get()
    .then(snapshot => {
      let masteradminData = [];

      snapshot.docs.forEach(doc => {
        masteradminData.push(doc.data().contact_no)
      })
      setAlertRecipients(masteradminData);
    })
  }

  const compareTimestamp = (a, b) => {
    if(a.sign_in_time > b.sign_in_time){
        return -1;
    }else if(a.sign_in_time < b.sign_in_time){
        return 1;
    }else{
        return 0;
    }
  }

  const sortEntries = () => {
    const sortedVisitors = [...visitorState].sort(compareTimestamp);
    const sortedStaffs = [...staffState].sort(compareTimestamp);
    setVisitorState(sortedVisitors);
    setStaffState(sortedStaffs);
  }

  const sendAlert = async () => {
    if(alertIncident === ''){
      Alert.alert("Please select what is the alert.")
    }else{
      const isAvailable = await SMS.isAvailableAsync();
      const message = "Alert from Trienekens Security App at " + global.premiseLocation + ". \n\nPerson name: " + alertPerson + "\nPerson contact no: " + alertPersonNo + ". \n\nIssue: " + alertIncident
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(alertRecipients, message);
      } else {
        Alert.alert("SMS is not available on this device.")
      }
    }
  }

  const toggleModal = (visitorName, visitorNo) => {
    setVisible(true);
    setAlertPerson(visitorName);
    setAlertPersonNo(visitorNo);
  };

  const offlinePictureSignOut = (id) => {
    firebase.firestore()
      .collection('Entries')
      .doc(id)
      .update({
        sign_out_time: firebase.firestore.Timestamp.fromDate(new Date()),
        sign_out_photo: '',
      }).catch(error => {
        Alert.alert(error)
      })

    Alert.alert("Entry signed-out.")
  }

  const renderVisitorsList = visitorState.map((visitor, key) => {
    return(
        <TouchableWithoutFeedback key={key}>
          <Block>
            <Divider/>
            <Block style={styles.testitemContainer}>
              <View style={styles.testavatarContainer}>
                <Avatar
                    size="large"
                    title="NA"
                    source={{uri:visitor.pic !== ""  ? visitor.pic : 'https://via.placeholder.com/'}}
                    activeOpacity={0.7}
                >
                  <MaterialCommunityIcons style={{position:"absolute", top:-10, left: -13,}} name="alert-circle" size={24} color="#CE5555" onPress={() => toggleModal(visitor.name, visitor.contact_no)}/>
                </Avatar>
              </View>
              <View style={{flex:1,}}>
                <Text style={styles.testitemName} numberOfLines={1}>{visitor.name}</Text>
                <Text style={styles.testitemLoc} numberOfLines={1}>{visitor.company}</Text>
                <View style={styles.testitemPurpose} >
                  <Text numberOfLines={1}>{visitor.purpose}</Text>
                </View>
              </View>
              <View style={styles.testbuttonContainer}>
                <Button key={key} mode="outlined" onPress={global.internetConnectivity ? () =>
                        navigation.navigate('PictureSignOut',{docID: visitor.id})
                    : () => offlinePictureSignOut(visitor.id)}
                >
                  <Text style={styles.signoutButton}>SIGN OUT</Text>
                </Button>
              </View>
            </Block>
          </Block>
        </TouchableWithoutFeedback>
    );
  })

  const renderStaffsList = staffState.map((staff, key) => {
    return(
        <TouchableWithoutFeedback key={key}>
          <Block>
            <Divider/>
            <Block style={styles.testitemContainer}>
              <View style={styles.testavatarContainer}>
                <Avatar
                    size="large"
                    source={{uri:staff.pic !== "" ? staff.pic : 'https://via.placeholder.com/'}}
                    activeOpacity={0.7}
                >
                  <MaterialCommunityIcons style={{position:"absolute", top:-10, left: -13,}} name="alert-circle" size={24} color="#CE5555" onPress={() => toggleModal(staff.name, staff.contact_no)}/>
                </Avatar>
              </View>
              <View style={{flex:1,}}>
                <Text style={styles.testitemName} numberOfLines={1}>{staff.name}</Text>
                <Text style={styles.testitemLoc} numberOfLines={1}>{staff.company}</Text>
                <View style={styles.testitemPurpose}>
                  <Text numberOfLines={1}>{staff.purpose}</Text>
                </View>
              </View>
              <View style={styles.testbuttonContainer}>
                <Button key={key} mode="outlined" onPress={global.internetConnectivity ? () =>
                        navigation.navigate('PictureSignOut',{docID: staff.id})
                    : () => offlinePictureSignOut(staff.id)}
                >
                  <Text style={styles.signoutButton}>SIGN OUT</Text>
                </Button>
              </View>
            </Block>
          </Block>
        </TouchableWithoutFeedback>
    );
  })

  if (loading) {
    return (
        <View style={{flex: 1, justifyContent: "center"}}>
          <ActivityIndicator color='rgb(21, 31, 53)' size="large"/>
        </View>
    );
  }

  return(
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
      <Modal isVisible={visible} onBackdropPress={() => setVisible(false)}>
        <View style={{justifyContent:'center', marginHorizontal: 40, padding: 40, backgroundColor: 'white', borderRadius: 20}}>
          <DropDownPicker
            open={alertDropdownOpen}
            value={alertIncident} // The selected value
            items={[
              {label: 'Not signed out', value: 'not signed out'}
            ]}
            setOpen={(open) => setAlertDropdownOpen(open)}
            setValue={(callback) => setAlertIncident(callback(alertIncident))}
            containerStyle={{height: 40}}
            defaultValue={'not sign out'}
            dropDownMaxHeight={120}
            onChangeValue={(value) => {setAlertIncident(value)}}
            placeholder="Select an alert"
          />
          <Button style={{marginTop: 100}} buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => sendAlert()}>
            ALERT ADMIN
          </Button>
        </View>
      </Modal>
      <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
      <Text style={styles.testlistTitle}>VISITORS — {visitorState.length}</Text>
      <Divider style={{height: 1}}/>
      {renderVisitorsList}

      <View style={{height: 50}}></View>
      <Text style={styles.testlistTitle}>STAFF — {staffState.length}</Text>
      <Divider style={{height: 1}}/>
      {renderStaffsList}

      <View style={styles.signOutContainer}>
      <Button icon='logout' buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => unsubscribeListeners()}>
        LOG OUT
      </Button>
      </View>
    </ScrollView>
  )
}


const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
  },
  signoutButton:{
    color: '#2F465B',
    fontWeight: 'bold'
  },

  testbranchTitle:{
    color: 'gray',
    textAlign: 'right',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 10,
    marginBottom: 20,
    marginTop: 15
  },
  testavatarContainer:{
    justifyContent: 'center',
    marginRight: 10
  },
  testlistTitle:{
    fontSize: 20,
    marginVertical: 10,
    fontWeight: 'bold'
  },
  testitemContainer:{
    marginVertical: 10,
    marginHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testitemAvatar: {
    borderRadius:0,
    borderColor:'transparent',
    backgroundColor:'transparent'
  },
  testitemName:{
    fontSize: 20
  },
  testitemLoc:{
    color:"gray",
    fontStyle: 'italic'
  },
  testitemPurpose:{
    flex:1,
    justifyContent: 'flex-end'
  },
  testbuttonContainer: {
    justifyContent: 'center'
  },
  signOutContainer: {
    alignSelf: "center",
    marginTop: 80,
    marginBottom: 30
  }

});

