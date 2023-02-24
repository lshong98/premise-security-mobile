import * as React from 'react';
import { StyleSheet, View, Dimensions, ScrollView, Alert, KeyboardAvoidingView } from 'react-native';
import { Text, Button, TextInput, Switch } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const { height, width } = Dimensions.get('screen');
export default class OtherPersonScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name: '',
      contact_no: '',
      department: '',
      email: '',
      company: '',
      consent: false,
      internetConnectivity: null,
      creating: false
    }
  }

  _onToggleSwitch = () => this.setState({ consent: !this.state.consent });

  submitOfflineData = async (company, contactNo, name) => {
    const { navigation } = this.props;

    firebase.firestore()
      .collection('Entries')
      .add({
        company: company,
        name: name,
        contact_no: contactNo,
        no_of_people: 1,
        visit_purpose: '',
        host: '',
        host_department: '',
        premise: global.premiseLocation,
        sign_in_time: firebase.firestore.Timestamp.fromDate(new Date()),
        sign_in_photo: '',
        sign_out_time: '',
        sign_out_photo: ''
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Entries');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      })
    
    navigation.navigate('HomeSignOut')
    Alert.alert("Entry created.")
  }
  
  submitVisitorForm = async () => {
    let querySnapshot = await firebase.firestore()
      .collection("VisitorProfiles")
      .where("name", "==", this.state.name)
      .where("contact_no", "==", this.state.contact_no)
      .get()

    if(!querySnapshot.empty){
      Alert.alert("A user with the same name and contact no. exists in the database.")
    }else{
      firebase.firestore()
      .collection('VisitorProfiles')
      .add({
        name: this.state.name,
        contact_no: this.state.contact_no,
        email: this.state.email,
        company: this.props.route.params.companyName,
        sortField: this.state.name.substr(0, 2).toLowerCase()
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Visitors');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })
      Alert.alert("Person added to database.")

      this.props.navigation.navigate('EntrySignIn', {
        companyName: props.route.params.companyName,
        personName: this.state.name,
        contactNo: this.state.contact_no,
        isVisitor: true
      })
    }
  }

  submitStaffForm = async () => {
    let querySnapshot = await firebase.firestore()
      .collection("StaffProfiles")
      .where("name", "==", this.state.name)
      .where("contact_no", "==", this.state.contact_no)
      .get()

    if(!querySnapshot.empty){
      Alert.alert("A user with the same name and contact no. exists in the database.")
    }else{
      firebase.firestore()
      .collection('StaffProfiles')
      .add({
        name: this.state.name,
        contact_no: this.state.contact_no,
        email: this.state.email,
        branch: props.route.params.companyName,
        department: this.state.department,
        sortField: this.state.name.substr(0, 2).toLowerCase()
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Staffs');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })
      Alert.alert("Staff added to database.")
        
      if(global.internetConnectivity){
        this.props.navigation.navigate('PictureSignIn', {
          companyName: props.route.params.companyName,
          contactNo: this.state.contact_no,
          personName: this.state.name,
          isVisitor: false
        })
      } else{
        this.submitOfflineData(props.route.params.companyName, this.state.contactNo, this.state.name)
      }
    }
  }

  checkForm = () => {
    const email_regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    const contact_regex = /^(\+?6?0)[0-9][0-46-9][0-9]{6,8}$/;
    const companyName = props.route.params.companyName;
    const isVisitor = props.route.params.isVisitor;
    let emailValid = true;

    if(this.state.email !== ''){
      if (email_regex.test(this.state.email) === false){
        emailValid = false;
      } 
    }

    if(this.state.consent != true){
      Alert.alert("Please give us consent to use your information.")
    } else if (this.state.name == ''){
      Alert.alert("Person name cannot be empty")
    } else if (this.state.contact_no == ''){
      Alert.alert("Phone number cannot be empty")
    } else if(contact_regex.test(this.state.contact_no) === false){
      Alert.alert("Phone number is not valid")
    } else if(!emailValid){
      Alert.alert("Email is not valid")
    } else {
      if(isVisitor == false){
        if(this.state.department == ''){
          Alert.alert("Department cannot be empty")
        }else{
          this.setState({creating: true})
          this.submitStaffForm()
        }
      } else {
        this.setState({creating: true})
        this.submitVisitorForm()
      } 
    }
  }


  render(){
    const companyName = props.route.params.companyName;
    return (
      <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>PLEASE ENTER YOUR NAME</Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name: </Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.name}
            onChangeText={text => this.setState({ name: text })}
            placeholder='e.g. Leslie Ling'
          />
        </View>
        {(props.route.params.isVisitor == false) ? 
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Department ({companyName}): </Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.department}
            onChangeText={text => this.setState({ department: text })}
            placeholder='e.g. Human Resources'
          />
        </View> : <View></View>}
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number:</Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.contact_no}
            onChangeText={text => this.setState({ contact_no: text })}
            placeholder='e.g. 0109604222'
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>(optional) Email Address:</Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.email}
            onChangeText={text => this.setState({ email: text })}
            placeholder='e.g. definitelynotleslie@gmail.com'
            keyboardType='email-address'
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.consentContainer}>
          <Switch
            value={this.state.consent}
            onValueChange={this._onToggleSwitch}
          />
          <Text style={styles.consentText}>I consent to my information being used for entry monitoring</Text>
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
                this.checkForm()} disabled={this.state.creating}>
                CONTINUE
              </Button>
            </View>
          </View>
        </View>    
      </ScrollView>
      </KeyboardAvoidingView>
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
    height: 60,
    width
  },
  headerTitle:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 20, 
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
