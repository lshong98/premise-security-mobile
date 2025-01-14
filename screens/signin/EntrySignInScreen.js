import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Button, TextInput, Switch } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { Alert, Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const { width } = Dimensions.get('screen');

export default function EntrySignInScreen({navigation, route}) {
  const [ peopleNo, setPeopleNo ] = useState(1);
  const [ visitPurpose, setVisitPurpose ] = useState('');
  const [ personMeeting, setPersonMeeting ] = useState('');
  const [ personDepartment, setPersonDepartment ] = useState('');
  const [ carPlateNo, setCarPlateNo ] = useState('');
  const [ otherPurpose, setOtherPurpose ] = useState('');
  const [ walkingArea, setWalkingArea ] = useState('');
  const [ consent, setConsent ] = useState(false);
  const [ staffProfiles, setStaffProfiles ] = useState([]);
  const [ staffNames, setStaffNames ] = useState([]);
  const [countDropdownOpen, setCountDropdownOpen] = useState(false);
  const [purposeDropdownOpen, setPurposeDropdownOpen] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

  const getStaffProfiles = async () => {
    if(global.internetConnectivity){
      firebase.firestore()
      .collection('StaffProfiles')
      .orderBy('sortField', 'asc')
      .get()
      .then(snapshot => {
        let returnStaffData = [];
        let returnStaffNames = [];
        snapshot.docs.forEach(doc => {
          returnStaffData.push({...doc.data(), id: doc.id})
          returnStaffNames.push({label: doc.data().name, value: doc.data().name})
        })
        AsyncStorage.setItem('staffProfiles', JSON.stringify(returnStaffData))
        AsyncStorage.setItem('staffNames', JSON.stringify(returnStaffNames))
        setStaffProfiles(returnStaffData);
        setStaffNames(returnStaffNames);
      })
    }else{
      let returnStaffProfiles = await AsyncStorage.getItem('staffProfiles');
      let returnStaffNames = await AsyncStorage.getItem('staffNames');
      setStaffProfiles(JSON.parse(returnStaffProfiles));
      setStaffNames(JSON.parse(returnStaffNames));
    }
  }

  useEffect(() => {
    getStaffProfiles();
  },[]);

  const onToggleSwitch = () => setConsent(!consent);

  const submitOnlineData = () => {
    if(visitPurpose === ''){
      Alert.alert('Please state your purpose of visit.')
    }else if(visitPurpose === 'Visit/Meeting/Audit/Inspection' && personMeeting === ''){
      Alert.alert('Please state who you are meeting.');
    }else if(visitPurpose === 'Walk-in customer' && walkingArea === ''){
      Alert.alert('Please state walk-in area.');
    }else if(carPlateNo === '') {
      Alert.alert('Please key in car plate no.')
    }else if(consent !== true) {
      Alert.alert('Please give us consent to use your information.')
    }else {
      if(visitPurpose !== 'Visit/Meeting/Audit/Inspection'){
        setPersonMeeting('');
        setPersonDepartment('');
      }

      if(visitPurpose === 'Others'){
        setVisitPurpose(otherPurpose);
      }

      if(visitPurpose !== 'Walk-in customer'){
        setWalkingArea('');
      }

      navigation.navigate('PictureSignIn', {
        companyName: route.params.companyName,
        personName: route.params.personName,
        contactNo: route.params.contactNo,
        noOfPeople: peopleNo,
        visitPurpose: visitPurpose,
        personMeeting: personMeeting,
        personDepartment: personDepartment,
        walkinArea: walkingArea,
        carPlateNo: carPlateNo,
        from: 'EntrySignIn',
        isVisitor: route.params.isVisitor
      });
    }
  }

  const submitOfflineData = async () => {

    if(visitPurpose === ''){
      Alert.alert('Please state your purpose of visit.')
    }else if(visitPurpose === 'Visit/Meeting/Audit/Inspection' && personMeeting === ''){
      Alert.alert('Please state who you are meeting.');
    }else if(visitPurpose === 'Walk-in customer' && walkingArea === ''){
      Alert.alert('Please state walk-in area.');
    }else if(consent !== true) {
      Alert.alert('Please give us consent to use your information.')
    }else {
      if(visitPurpose !== 'Visit/Meeting/Audit/Inspection'){
        setPersonMeeting('');
        setPersonDepartment('');
      }

      if(visitPurpose === 'Others'){
        setVisitPurpose(otherPurpose);
      }

      if(visitPurpose !== 'Walk-in customer'){
        setWalkingArea('');
      }

      firebase.firestore()
        .collection('Entries')
        .add({
          company: route.params.companyName,
          name: route.params.personName,
          contact_no: route.params.contactNo,
          no_of_people: peopleNo,
          visit_purpose: visitPurpose,
          host: personMeeting,
          host_department: personDepartment,
          walkin_area: walkingArea,
          premise: global.premiseLocation,
          sign_in_time: firebase.firestore.Timestamp.fromDate(new Date()),
          sign_in_photo: '',
          sign_out_time: '',
          sign_out_photo: ''
        }).then(() => {
          let counterRef = firebase.firestore().collection('Counters').doc('Entries');
          counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        }).catch(error => {
          Alert.alert(error)
        })
      navigation.navigate('HomeSignOut')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>PLEASE ENTER DETAILS</Text>
      </View>

      <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 5000} : {...styles.dropdownContainer}}>
        <Text style={styles.inputLabel}>No. of People: </Text>
        <DropDownPicker
            open={countDropdownOpen}
            setOpen={(open) => setCountDropdownOpen(open)}
            value={peopleNo}
            setValue={setPeopleNo}
            items={[
              {label: '1', value: 1},
              {label: '2', value: 2},
              {label: '3', value: 3},
              {label: '4', value: 4}
            ]}
            containerStyle={styles.dropdown}
        />
      </View>

      <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 4000} : {...styles.dropdownContainer}}>
        <Text style={styles.inputLabel}>Purpose of visit: </Text>
        <DropDownPicker
            open={purposeDropdownOpen}
            setOpen={(open) => setPurposeDropdownOpen(open)}
            value={visitPurpose}
            setValue={setVisitPurpose}
            items={[
              {label: 'Collection of rubbish bin', value: 'Collection of rubbish bin'},
              {label: 'RoRo Matters', value: 'RoRo Matters'},
              {label: 'Supplier/Contractor/Maintenance Work', value: 'Supplier/Contractor/Maintenance Work'},
              {label: 'Visit/Meeting/Audit/Inspection', value: 'Visit/Meeting/Audit/Inspection'},
              {label: 'Walk-in customer', value: 'Walk-in customer'},
              {label: 'Transportation contractor', value: 'Transportation contractor'},
              {label: 'Others', value: 'Others'}
            ]}
          containerStyle={styles.dropdown}
        />
      </View>
      {visitPurpose === 'Visit/Meeting/Audit/Inspection' ?
      <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 3000} : {...styles.dropdownContainer}}>
        <Text style={styles.inputLabel}>Person I am meeting</Text>
        <DropDownPicker
            open={staffDropdownOpen}
            setOpen={(open) => setStaffDropdownOpen(open)}
            value={personMeeting}
            setValue={setPersonMeeting}
            items={staffNames}
            containerStyle={styles.dropdown}
            onChangeValue={value => {
              staffProfiles.forEach((staff) => {
                if(staff.name === value){
                  setPersonDepartment(staff.department);
                }
              })
            }}
        />
      </View> : null}
      {visitPurpose === 'Visit/Meeting/Audit/Inspection' ?
      <View style={{
        ...styles.inputContainer}}>
        <Text style={styles.inputLabel}>Department of the person I am meeting</Text>
        <TextInput
          mode='outlined'
          style={styles.inputTextField}
          value={personDepartment}
          onChangeText={text => setPersonDepartment(text)}
          editable={false}
        />
      </View> : null}
      {visitPurpose === 'Walk-in customer' ?
      <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 3000} : {...styles.dropdownContainer}}>
        <Text style={styles.inputLabel}>Walk in area</Text>
        <DropDownPicker
            open={areaDropdownOpen}
            setOpen={(open) => setAreaDropdownOpen(open)}
            value={walkingArea}
            setValue={setWalkingArea}
            items={[
              {label: 'KIWMP', value: 'KIWMP'},
              {label: 'Kidurong dumpsite', value: 'Kidurong dumpsite'},
            ]}
            containerStyle={styles.dropdown}
        />
      </View> : null}
      {visitPurpose === 'Others' ?
      <View style={{
        ...styles.inputContainer}}>
        <Text style={styles.inputLabel}>Please specify your purpose.</Text>
        <TextInput
          label={false}
          mode='outlined'
          style={styles.inputTextField}
          value={otherPurpose}
          onChangeText={text => setOtherPurpose(text)}
        />
      </View> : null}
      <View style={{
        ...styles.inputContainer}}>
        <Text style={styles.inputLabel}>Car Plate No</Text>
        <TextInput
            mode='outlined'
            style={styles.inputTextField}
            value={carPlateNo}
            onChangeText={text => setCarPlateNo(text)}
            editable={true}
        />
      </View>
      <View style={styles.consentContainer}>
        <Switch
          value={consent}
          onValueChange={onToggleSwitch}
        />
        <Text style={styles.consentText}>I consent to my information being used for attendance monitoring</Text>
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
            <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={global.internetConnectivity ? () =>
              submitOnlineData()
            : () => submitOfflineData()} >
              CONTINUE
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, 
    flexDirection: 'column', 
    justifyContent: 'space-between'
  },
  headerContainer:{
    justifyContent: 'center',
    backgroundColor: '#2F465B',
    height: 60
  },
  headerTitle:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 20, 
  },
  dropdownContainer:{
    marginTop: 30,
    alignSelf: 'center',
    width: width*0.8
  },
  dropdown:{
    marginTop: 5, 
    height: 40, 
    width: width * 0.8,
    flex: 1
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
  consentContainer:{
    width: width * 0.8,
    marginTop: 30,
    flexDirection: "row",
    alignSelf: 'center'
  },
  consentText:{
    fontSize: 12,
    flex: 1,
    marginLeft: 5,
    flexWrap: 'wrap'
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
});
