import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Button, TextInput, Switch, Alert } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
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
  const [ isLoading, setIsLoading ] = useState(true);
  const [ error, setError ] = useState(null);
  const [countDropdownOpen, setCountDropdownOpen] = useState(false);
  const [purposeDropdownOpen, setPurposeDropdownOpen] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

  const getStaffProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (global.internetConnectivity) {
        const snapshot = await firebase.firestore()
          .collection('StaffProfiles')
          .orderBy('sortField', 'asc')
          .get();

        const returnStaffData = [];
        const returnStaffNames = [];

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          returnStaffData.push({ ...data, id: doc.id });
          returnStaffNames.push({ label: data.name, value: data.name });
        });

        await AsyncStorage.setItem('staffProfiles', JSON.stringify(returnStaffData));
        await AsyncStorage.setItem('staffNames', JSON.stringify(returnStaffNames));

        setStaffProfiles(returnStaffData);
        setStaffNames(returnStaffNames);
      } else {
        const [returnStaffProfiles, returnStaffNames] = await Promise.all([
          AsyncStorage.getItem('staffProfiles'),
          AsyncStorage.getItem('staffNames')
        ]);

        if (!returnStaffProfiles || !returnStaffNames) {
          throw new Error('No offline data available');
        }

        setStaffProfiles(JSON.parse(returnStaffProfiles));
        setStaffNames(JSON.parse(returnStaffNames));
      }
    } catch (error) {
      console.error('Error in getStaffProfiles:', error);
      setError('Failed to load staff profiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await getStaffProfiles();
      } catch (error) {
        console.error('Error in loadData:', error);
        if (mounted) {
          setError('Failed to load data');
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const onToggleSwitch = () => setConsent(prev => !prev);

  const validateForm = () => {
    const errors = [];

    if (!visitPurpose) {
      errors.push('Please state your purpose of visit.');
    }
    if (visitPurpose === 'Visit/Meeting/Audit/Inspection' && !personMeeting) {
      errors.push('Please state who you are meeting.');
    }
    if (visitPurpose === 'Walk-in customer' && !walkingArea) {
      errors.push('Please state walk-in area.');
    }
    if (!carPlateNo) {
      errors.push('Please key in car plate no.');
    }
    if (!consent) {
      errors.push('Please give us consent to use your information.');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  };

  const submitOnlineData = async () => {
    try {
      validateForm();

      let finalVisitPurpose = visitPurpose;
      let finalPersonMeeting = personMeeting;
      let finalPersonDepartment = personDepartment;
      let finalWalkingArea = walkingArea;

      if (visitPurpose !== 'Visit/Meeting/Audit/Inspection') {
        finalPersonMeeting = '';
        finalPersonDepartment = '';
      }

      if (visitPurpose === 'Others') {
        finalVisitPurpose = otherPurpose;
      }

      if (visitPurpose !== 'Walk-in customer') {
        finalWalkingArea = '';
      }

      navigation.navigate('PictureSignIn', {
        companyName: route.params.companyName,
        personName: route.params.personName,
        contactNo: route.params.contactNo,
        noOfPeople: peopleNo,
        visitPurpose: finalVisitPurpose,
        personMeeting: finalPersonMeeting,
        personDepartment: finalPersonDepartment,
        walkinArea: finalWalkingArea,
        carPlateNo,
        from: 'EntrySignIn',
        isVisitor: route.params.isVisitor
      });
    } catch (error) {
      Alert.alert(
        'Form Validation',
        error.message,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  const submitOfflineData = async () => {
    try {
      validateForm();

      let finalVisitPurpose = visitPurpose;
      let finalPersonMeeting = personMeeting;
      let finalPersonDepartment = personDepartment;
      let finalWalkingArea = walkingArea;

      if (visitPurpose !== 'Visit/Meeting/Audit/Inspection') {
        finalPersonMeeting = '';
        finalPersonDepartment = '';
      }

      if (visitPurpose === 'Others') {
        finalVisitPurpose = otherPurpose;
      }

      if (visitPurpose !== 'Walk-in customer') {
        finalWalkingArea = '';
      }

      await firebase.firestore()
        .collection('Entries')
        .add({
          company: route.params.companyName,
          name: route.params.personName,
          contact_no: route.params.contactNo,
          no_of_people: peopleNo,
          visit_purpose: finalVisitPurpose,
          host: finalPersonMeeting,
          host_department: finalPersonDepartment,
          walkin_area: finalWalkingArea,
          premise: global.premiseLocation,
          sign_in_time: firebase.firestore.Timestamp.fromDate(new Date()),
          sign_in_photo: '',
          sign_out_time: '',
          sign_out_photo: '',
          carPlateNo
        });

      await firebase.firestore()
        .collection('Counters')
        .doc('Entries')
        .update({
          counter: firebase.firestore.FieldValue.increment(1)
        });

      navigation.navigate('HomeSignOut');
      Alert.alert(
        'Success',
        'Entry created successfully',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error in submitOfflineData:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit data. Please try again.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading staff profiles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={getStaffProfiles}
          style={styles.retryButton}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>PLEASE ENTER DETAILS</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={[
          styles.dropdownContainer,
          Platform.OS !== 'android' && { zIndex: 5000 }
        ]}>
          <Text style={styles.inputLabel}>No. of People: </Text>
          <DropDownPicker
            open={countDropdownOpen}
            setOpen={setCountDropdownOpen}
            value={peopleNo}
            setValue={setPeopleNo}
            items={[
              {label: '1', value: 1},
              {label: '2', value: 2},
              {label: '3', value: 3},
              {label: '4', value: 4}
            ]}
            containerStyle={styles.dropdown}
            listMode="SCROLLVIEW"
          />
        </View>

        <View style={[
          styles.dropdownContainer,
          Platform.OS !== 'android' && { zIndex: 4000 }
        ]}>
          <Text style={styles.inputLabel}>Purpose of visit: </Text>
          <DropDownPicker
            open={purposeDropdownOpen}
            setOpen={setPurposeDropdownOpen}
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
            listMode="SCROLLVIEW"
          />
        </View>
        {visitPurpose === 'Visit/Meeting/Audit/Inspection' && (
          <>
            <View style={[
              styles.dropdownContainer,
              Platform.OS !== 'android' && { zIndex: 3000 }
            ]}>
              <Text style={styles.inputLabel}>Person I am meeting</Text>
              <DropDownPicker
                open={staffDropdownOpen}
                setOpen={setStaffDropdownOpen}
                value={personMeeting}
                setValue={setPersonMeeting}
                items={staffNames}
                containerStyle={styles.dropdown}
                listMode="SCROLLVIEW"
                onChangeValue={value => {
                  staffProfiles.forEach((staff) => {
                    if(staff.name === value){
                      setPersonDepartment(staff.department);
                    }
                  });
                }}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Department of the person I am meeting</Text>
              <TextInput
                mode='outlined'
                style={styles.inputTextField}
                value={personDepartment}
                editable={false}
              />
            </View>
          </>
        )}
        {visitPurpose === 'Walk-in customer' && (
          <View style={[
            styles.dropdownContainer,
            Platform.OS !== 'android' && { zIndex: 3000 }
          ]}>
            <Text style={styles.inputLabel}>Walk in area</Text>
            <DropDownPicker
              open={areaDropdownOpen}
              setOpen={setAreaDropdownOpen}
              value={walkingArea}
              setValue={setWalkingArea}
              items={[
                {label: 'KIWMP', value: 'KIWMP'},
                {label: 'Kidurong dumpsite', value: 'Kidurong dumpsite'},
              ]}
              containerStyle={styles.dropdown}
              listMode="SCROLLVIEW"
            />
          </View>
        )}
        {visitPurpose === 'Others' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Please specify your purpose.</Text>
            <TextInput
              mode='outlined'
              style={styles.inputTextField}
              value={otherPurpose}
              onChangeText={text => setOtherPurpose(text)}
            />
          </View>
        )}
        <View style={styles.inputContainer}>
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
      </View>

      <View style={styles.buttonVerticalContainer}>
        <View style={styles.buttonHorizontalContainer}>
          <View style={styles.buttonContainer}>
            <Button 
              style={styles.buttonText} 
              buttonColor={"#2F465B"} 
              mode="contained" 
              onPress={() => navigation.goBack()}
            >
              BACK
            </Button>
          </View>
          <View style={styles.buttonContainer}>
            <Button 
              style={styles.buttonText} 
              buttonColor={"#2F465B"} 
              mode="contained" 
              onPress={global.internetConnectivity ? submitOnlineData : submitOfflineData}
            >
              CONTINUE
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  headerContainer: {
    justifyContent: 'center',
    backgroundColor: '#2F465B',
    height: 60,
    width: '100%'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  },
  dropdownContainer: {
    marginBottom: 20
  },
  dropdown: {
    height: 40
  },
  inputContainer: {
    marginBottom: 20
  },
  inputLabel: {
    marginBottom: 5,
    fontSize: 16,
    color: '#333'
  },
  inputTextField: {
    backgroundColor: '#fff'
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  consentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666'
  },
  buttonVerticalContainer: {
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
  buttonContainer: {
    marginVertical: 15,
    marginHorizontal: 15, 
    justifyContent: 'flex-end'
  },
  buttonText: {
    justifyContent: 'center'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#2F465B'
  }
});
