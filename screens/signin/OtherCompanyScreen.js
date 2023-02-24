import * as React from 'react';
import { StyleSheet, View, Dimensions, ScrollView, Alert, KeyboardAvoidingView } from 'react-native';
import { Text, Button, TextInput, Switch } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


const { height, width } = Dimensions.get('screen');
export default class OtherCompanyScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      company: '',
      contact_no: '',
      email: '',
      consent: false,
      creating: false
    }
  }

  submitForm = async() => {
    let querySnapshot = await firebase.firestore()
      .collection("CompanyProfiles")
      .where("name", "==", this.state.company)
      .get()

    if(!querySnapshot.empty){
        Alert.alert("A company with the same name exists in the database.")
    }else{
      firebase.firestore()
      .collection('CompanyProfiles')
      .add({
        name: this.state.company.trim(),
        contact_no: this.state.contact_no,
        email: this.state.email,
      }).catch(error => {
        Alert.alert(error)
      })

      Alert.alert("Company added to database.")
      this.props.navigation.navigate('SignInPerson', {
        companyName: this.state.company,
      })
    }
  }

  checkForm = () => {
    const email_regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    const contact_regex = /^(\+?6?0)[0-9][0-46-9][0-9]{6,8}$/;
    let contactValid = true, emailValid = true;

    if(this.state.contact_no !== ''){
      if (contact_regex.test(this.state.contact_no) === false){
        contactValid = false;
      } 
    }

    if(this.state.email !== ''){
      if (email_regex.test(this.state.email) === false){
        emailValid = false;
      } 
    }

    if(this.state.consent != true){
      Alert.alert("Please give us consent to use your information.")
    } else if (this.state.company == ''){
      Alert.alert("Company name cannot be empty")
    } else if(!contactValid){
      Alert.alert("Phone number is not valid")
    } else if(!emailValid){
      Alert.alert("Email is not valid")
    } else{
      this.setState({creating: true})
      this.submitForm()
    }
  }

  _onToggleSwitch = () => this.setState({ consent: !this.state.consent });

  render(){
    return (
      <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>PLEASE ENTER YOUR COMPANY</Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Company Name: </Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.company}
            onChangeText={text => this.setState({ company: text })}
            placeholder='e.g. Swinburne University'
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>(optional) Company Phone Number: </Text>    
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
          <Text style={styles.inputLabel}>(optional) Company Email Address: </Text>    
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
