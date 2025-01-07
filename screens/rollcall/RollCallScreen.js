import * as React from 'react';
import { StyleSheet, ScrollView, Dimensions, View, ActivityIndicator, TouchableWithoutFeedback, Alert, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Divider, Button, Text, TextInput} from 'react-native-paper';
import { Block } from '../../components';
import { Avatar, CheckBox } from 'react-native-elements';
import * as SMS from 'expo-sms';

const { height, width } = Dimensions.get('screen');
export default class RollCallScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      message: '',
      recipients: [],
      smsAdminrecipients: [],
      loading: true,
      visitorState: [],
      staffState: [],
      checkedV: false,
      checkedS: false,
    }
  }
  
  async componentDidMount(){
    this._isMounted = true;
    let premises = JSON.parse(await AsyncStorage.getItem('allpremises'));
    let premiseList = [];

    premises.forEach(premise => {
      if(premise.includes("(")){
        premise = premise.substring(0, premise.indexOf('('))
      }

      if(!premiseList.includes(premise.trim())){
        premiseList.push(premise.trim())
      }
    })

    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    let unsubscribeRollCall = firebase.firestore()
    .collection('Entries')
    .where('sign_out_time', '==', '')
    .where('premise', '==', global.premiseLocation)
    .onSnapshot(snapshot => {
      let visitorSource = [];
      let staffSource = [];
      
      if(this._isMounted){
        snapshot.docs.forEach(doc => {
          if(!doc.data().isVisitor)
            staffSource.push({
              id: doc.id, 
              name: doc.data().name, 
              company: doc.data().company, 
              purpose: doc.data().visit_purpose, 
              pic: doc.data().sign_in_photo,
              contact_no: doc.data().contact_no})
          else 
            visitorSource.push({
              id: doc.id, 
              name: doc.data().name, 
              company: doc.data().company, 
              purpose: doc.data().visit_purpose, 
              pic: doc.data().sign_in_photo, 
              contact_no: doc.data().contact_no})
        })
        this.setState({visitorState: visitorSource})
        this.setState({staffState: staffSource})
        this.setState({loading: false})
      }
    })
    
    global.subscribers.push(unsubscribeRollCall)

    firebase.firestore()
    .collection('Accounts')
    .where('role', 'in', ['Admin', 'Master-Admin', 'Executive'])
    .where('premises', 'array-contains', premise)
    .get()
    .then(snapshot => {
      let adminData = [];
      snapshot.docs.forEach(doc => {
        adminData.push(doc.data().contact_no)
      })
      this.setState({smsAdminrecipients: adminData})
    })
  }

  sendSMS = async () => {
    if(this.state.recipients.length === 0){
      Alert.alert("No recipients are selected.")
    }else if(this.state.message === ''){
      Alert.alert("Message is empty.")
    }else{
      const isAvailable = await SMS.isAvailableAsync();
      const allRecipients = [...this.state.recipients, ...this.state.smsAdminrecipients];
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(allRecipients, this.state.message);
      } else {
        Alert.alert("SMS is not available on this device.")
      }      
    }
  }

  checkContact = (contact) => {
    const { recipients } = this.state;
    let recipientArr = [];

    if (!recipients.includes(contact)) {
      recipientArr = [...recipients, contact];
    } else {
      recipientArr = recipients.filter(a => a !== contact);
    }
    this.setState({ recipients: recipientArr })
  };


  renderList = () => {
    let renderVisitorsList = this.state.visitorState.map((visitor, key) => {
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
              />
            </View>
            <View style={{flex:1,}}>
              <Text style={styles.testitemName} numberOfLines={1}>{visitor.name}</Text>
              <Text style={styles.testitemLoc} numberOfLines={1}>{visitor.company}</Text>
              <View style={styles.testitemPurpose} >
                <Text numberOfLines={1}>{visitor.visit_purpose}</Text>
              </View>
            </View>
            <View style={styles.testbuttonContainer}>
              <CheckBox
                checked={this.state.recipients.includes(visitor.contact_no)}
                onPress={() => this.checkContact(visitor.contact_no)}
                checkedColor='rgb(21, 31, 53)'
              />
            </View>
          </Block>
          </Block>
        </TouchableWithoutFeedback>
      );
    })

    let renderStaffsList = this.state.staffState.map((staff, key) => {
      
      return(
        <TouchableWithoutFeedback key={key}>
          <Block>
          <Divider/>
          <Block style={styles.testitemContainer}>
            <View style={styles.testavatarContainer}>
              <Avatar
                size="large"
                title="NA"
                source={{uri:staff.pic !== "" ? staff.pic : 'https://via.placeholder.com/'}}
                activeOpacity={0.7}
              />
            </View>
            <View style={{flex:1,}}>
              <Text style={styles.testitemName} numberOfLines={1}>{staff.name}</Text>
              <Text style={styles.testitemLoc} numberOfLines={1}>{staff.company}</Text>
              <View style={styles.testitemPurpose} >
                <Text numberOfLines={1}>{staff.visit_purpose}</Text>
              </View>
            </View>
            <View style={styles.testbuttonContainer}>
              <CheckBox
                disabled={staff.contact_no === "" ? true : false}
                checked={this.state.recipients.includes(staff.contact_no)}
                onPress={() => {this.checkContact(staff.contact_no)}}
                checkedColor='rgb(21, 31, 53)'
              />
            </View>
          </Block>
          </Block>
        </TouchableWithoutFeedback>
      );
    })


    return(
      <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
        <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
        <Text style={styles.testlistTitle}>VISITORS - {this.state.visitorState.length}</Text>
        <Divider style={{height: 1}}/>
        {renderVisitorsList}

        <View style={{height: 50}}></View>
        <Text style={styles.testlistTitle}>STAFF - {this.state.staffState.length}</Text>
        <Divider style={{height: 1}}/>
        {renderStaffsList}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Message:</Text>    
          <TextInput
            label={false}
            mode='outlined'
            style={styles.inputTextField}
            value={this.state.message}
            onChangeText={text => this.setState({ message: text })}
            placeholder='This is not a test!'
          />
        </View>
        <View style={{flexDirection: 'row', bottom: 0, justifyContent:'center', marginBottom: 50}}>
          <Button buttonColor='rgb(21, 31, 53)' mode="contained" onPress={this.sendSMS}>SEND ALERT MESSAGE</Button> 
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  render(){
    if (this.state.loading) {
      return (
        <View style={{flex: 1, justifyContent: "center"}}>
          <ActivityIndicator color='rgb(21, 31, 53)' size="large"/>
        </View>
      );
    } else {
      return (
        this.renderList()
      );
    }
  }
}


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
  },
  branchTitle:{
    color: 'gray',
    textAlign:'center',
  },
  listTitle:{
    color:"black"
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
    marginHorizontal: 5,
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


  inputContainer:{
    marginVertical: 30,
    alignSelf: 'center',
  },
  inputLabel: {
    fontSize: 14, 
    fontFamily: 'roboto-regular', 
    fontWeight: 'bold'
  },
  inputTextField:{
    width: width * 0.8, 
    // height: 40, 
    backgroundColor: 'white',
    fontSize: 16,
  },
});
