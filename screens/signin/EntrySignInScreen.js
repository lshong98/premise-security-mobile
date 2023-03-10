import * as React from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, Button, TextInput, Switch } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { Alert, Platform } from 'react-native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const { height, width } = Dimensions.get('screen');

export default class EntrySignInScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      no_of_people: 1,
      visit_purpose: '',
      person_meeting:'',
      person_department: '',
      other_purpose:'',
      walkin_area:'',
      consent: false,
      staffProfiles: [],
      staffNames: [],
    }
  }

  componentDidMount(){
    this.getStaffProfiles();
  }

  getStaffProfiles = async () => {
    if(global.internetConnectivity){
      firebase.firestore()
      .collection('StaffProfiles')
      .orderBy('sortField', 'asc')
      .get()
      .then(snapshot => {
        let staffData = [];
        let staffNames = [];
        snapshot.docs.forEach(doc => {
          staffData.push({...doc.data(), id: doc.id})
          staffNames.push({label: doc.data().name, value: doc.data().name})
        })
        AsyncStorage.setItem('staffProfiles', JSON.stringify(staffData))
        AsyncStorage.setItem('staffNames', JSON.stringify(staffNames))
        this.setState({staffProfiles: staffData, staffNames: staffNames})
      })
    }else{
      let staffProfiles = await AsyncStorage.getItem('staffProfiles');
      let staffNames = await AsyncStorage.getItem('staffNames');
      this.setState({staffProfiles: JSON.parse(staffProfiles), staffNames: JSON.parse(staffNames)});
    }
  }

  _onToggleSwitch = () => this.setState({ consent: !this.state.consent });

  submitOnlineData = () => {
    const { navigation } = this.props;
    let {no_of_people, visit_purpose, person_meeting, person_department, other_purpose, walkin_area} = this.state

    if(this.state.visit_purpose == ''){
      Alert.alert('Please state your purpose of visit.')
    }else if(this.state.visit_purpose == 'Visit/Meeting/Audit/Inspection' && person_meeting == ''){
      Alert.alert('Please state who you are meeting.');
    }else if(this.state.visit_purpose == 'Walk-in customer' && walkin_area == ''){
      Alert.alert('Please state walk-in area.');
    }else if(this.state.consent != true) {
      Alert.alert('Please give us consent to use your information.')
    }else {
      if(this.state.visit_purpose !== 'Visit/Meeting/Audit/Inspection'){
        person_meeting = ''
        person_department = ''
      }

      if(this.state.visit_purpose == 'Others'){
        visit_purpose =  other_purpose
      }

      if(this.state.visit_purpose !== 'Walk-in customer'){
        walkin_area = ''
      }

      this.props.navigation.navigate('PictureSignIn', {
        companyName: this.props.route.params.companyName,
        personName: this.props.route.params.personName,
        contactNo: this.props.route.params.contactNo,
        noOfPeople: no_of_people,
        visitPurpose: visit_purpose,
        personMeeting: person_meeting,
        personDepartment: person_department,
        walkinArea: walkin_area,
        from: 'EntrySignIn',
        isVisitor: this.props.route.params.isVisitor
      })
    }
  }

  submitOfflineData = async () => {
    const { navigation } = this.props;
    let {no_of_people, visit_purpose, person_meeting, person_department, other_purpose, walkin_area } = this.state;

    if(this.state.visit_purpose == ''){
      Alert.alert('Please state your purpose of visit.')
    }else if(this.state.visit_purpose == 'Visit/Meeting/Audit/Inspection' && person_meeting == ''){
      Alert.alert('Please state who you are meeting.');
    }else if(this.state.visit_purpose == 'Walk-in customer' && walkin_area == ''){
      Alert.alert('Please state walk-in area.');
    }else if(this.state.consent != true) {
      Alert.alert('Please give us consent to use your information.')
    }else {
      if(this.state.visit_purpose !== 'Visit/Meeting/Audit/Inspection'){
        person_meeting = ''
        person_department = ''
      }

      if(this.state.visit_purpose == 'Others'){
        visit_purpose =  other_purpose
      }

      if(this.state.visitPurpose !== 'Walk-in customer'){
        walkin_area = ''
      }

      firebase.firestore()
        .collection('Entries')
        .add({
          company: this.props.route.params.companyName,
          name: this.props.route.params.personName,
          contact_no: this.props.route.params.contactNo,
          no_of_people: no_of_people,
          visit_purpose: visit_purpose,
          host: person_meeting,
          host_department: person_department,
          walkin_area: walkin_area,
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

  render(){
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>PLEASE ENTER DETAILS</Text>
        </View>

        <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 5000} : {...styles.dropdownContainer}}>
          <Text style={styles.inputLabel}>No. of People: </Text>  
          <DropDownPicker
            items={[
              {label: '1', value: 1},
              {label: '2', value: 2},
              {label: '3', value: 3},
              {label: '4', value: 4}
            ]}
            containerStyle={styles.dropdown}
            onChangeItem={item => this.setState({ no_of_people: item.value })}
          />
        </View>

        <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 4000} : {...styles.dropdownContainer}}>
          <Text style={styles.inputLabel}>Purpose of visit: </Text>    
          <DropDownPicker
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
            onChangeItem={(item) => {
              this.setState({ visit_purpose: item.value })
            }}
          />
        </View>
        {this.state.visit_purpose == 'Visit/Meeting/Audit/Inspection' ?
        <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 3000} : {...styles.dropdownContainer}}>
          <Text style={styles.inputLabel}>Person I am meeting</Text>
          <DropDownPicker
            items={this.state.staffNames}
            containerStyle={styles.dropdown}
            onChangeItem={item => {
              this.state.staffProfiles.forEach((staff) => {
                if(staff.name == item.value){
                  return this.setState({person_department: staff.department})
                }
              })
              this.setState({ person_meeting: item.value })
            }}
          />
        </View> : null}
        {this.state.visit_purpose == 'Visit/Meeting/Audit/Inspection' ?
        <View style={{
          ...styles.inputContainer}}>
          <Text style={styles.inputLabel}>Department of the person I am meeting</Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.person_department}
            onChangeText={text => this.setState({ person_department: text })}
            editable={false}
          />
        </View> : null}
        {this.state.visit_purpose == 'Walk-in customer' ?
        <View style={Platform.OS !== 'android' ? {...styles.dropdownContainer, zIndex: 3000} : {...styles.dropdownContainer}}>
          <Text style={styles.inputLabel}>Walk in area</Text>
          <DropDownPicker
            items={[
              {label: 'KIWMP', value: 'KIWMP'},
              {label: 'Kidurong dumpsite', value: 'Kidurong dumpsite'},
            ]}
            containerStyle={styles.dropdown}
            onChangeItem={(item) => {
              this.setState({ walkin_area: item.value })
            }}
          />
        </View> : null}
        {this.state.visit_purpose == 'Others' ?
        <View style={{
          ...styles.inputContainer}}>
          <Text style={styles.inputLabel}>Please specify your purpose.</Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.other_purpose}
            onChangeText={text => this.setState({ other_purpose: text })}
          />
        </View> : null}
        <View style={styles.consentContainer}>
          <Switch
            value={this.state.consent}
            onValueChange={this._onToggleSwitch}
          />
          <Text style={styles.consentText}>I consent to my information being used for attendance monitoring</Text>
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
              <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={global.internetConnectivity ? () => 
                this.submitOnlineData()
              : () => this.submitOfflineData()} >
                CONTINUE
              </Button>
            </View>
          </View>
        </View>    
      </ScrollView>
    );
  }
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
