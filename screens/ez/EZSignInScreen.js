import * as React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Divider, Text, Button } from 'react-native-paper';
import { Block } from '../../components';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export default class EZSignInScreen extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      loading: true,
      ezSignIns: [],
    }
  } 

  async componentDidMount(){
    this._isMounted = true;
    let unsubscribeEZSignIn = firebase.firestore()
      .collection('EZSignIns')
      .where('premise', '==', global.premiseLocation)
      .onSnapshot(snapshot => {
          var data = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
          this.setState({ezSignIns: data})
        }
      )
    global.subscribers.push(unsubscribeEZSignIn)
  }

  componentWillUnmount() {
    this._isMounted = false; 
  }

  submitOfflineData = async (company, name, contactNo, no_of_people, visit_purpose, host, host_department, id, walkin_area) => {
    const { navigation } = this.props;

    firebase.firestore()
      .collection('Entries')
      .add({
        company: company,
        name: name,
        contact_no: contactNo,
        no_of_people: no_of_people,
        visit_purpose: visit_purpose,
        host: host,
        host_department: host_department,
        premise: global.premiseLocation,
        walkin_area: walkin_area,
        sign_in_time: firebase.firestore.Timestamp.fromDate(new Date()),
        sign_in_photo: '',
        sign_out_time: '',
        sign_out_photo: '',
        isVisitor: true
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Entries');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })

    firebase.firestore()
      .collection("EZSignIns")
      .doc(id)
      .delete();
      
    navigation.navigate('HomeSignOut')
    Alert.alert("Entry created.")
  }

  prepData = (ezSignIn) => {
    let person_meeting = ezSignIn.host
    let person_department = ezSignIn.host_department
    let visit_purpose = ezSignIn.visit_purpose;
    let walkin_area = ezSignIn.walkin_area;

    if(ezSignIn.visit_purpose !== 'Visit/Meeting/Audit/Inspection'){
      person_meeting = ''
      person_department = ''
    }

    if(ezSignIn.visit_purpose == 'Others'){
      visit_purpose =  ezSignIn.others_visit_purpose
    }

    if(ezSignIn.visit_purpose !== 'Walk-in customer'){
      walkin_area = ''
    }

    if(global.internetConnectivity){
      this.props.navigation.navigate('PictureSignIn', {
        companyName: ezSignIn.company,
        personName: ezSignIn.name,
        contactNo: ezSignIn.contact_no,
        noOfPeople: ezSignIn.no_of_people,
        visitPurpose: visit_purpose,
        personMeeting: person_meeting,
        personDepartment: person_department,
        walkinArea: walkin_area,
        id: ezSignIn.id,
        from: 'EZSignIn',
        isVisitor: true
      })
    }else{
      this.submitOfflineData(
        ezSignIn.company,
        ezSignIn.name,
        ezSignIn.contact_no,
        ezSignIn.no_of_people,
        visit_purpose,
        person_meeting,
        person_department,
        walkin_area,
        ezSignIn.id,
      )
    }
  }

  render(){
    let renderEZSignInList = this.state.ezSignIns.map((ezSignIn, key) => {
      return(
        <TouchableWithoutFeedback key={key}>
          <Block>
            <Divider/>
            <Block style={styles.testitemContainer}>
              <View style={{flex:1,}}>
                <Text style={styles.testitemName} numberOfLines={1}>{ezSignIn.name}</Text>
                <Text style={styles.testitemLoc} numberOfLines={1}>{ezSignIn.company}</Text>
                <View style={styles.testitemPurpose}>
                  <Text numberOfLines={1}>{ezSignIn.visit_purpose}</Text>
                </View>
              </View>
              <View style={styles.testbuttonContainer}>
                <Button key={key} mode="outlined" onPress={() => this.prepData(ezSignIn)}>
                  <Text style={styles.signoutButton}>SIGN IN</Text>
                </Button>
              </View>
            </Block>
          </Block>
        </TouchableWithoutFeedback> 
      );
    })

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} >
        <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
        <Text style={styles.testlistTitle}>EZ SIGN-INS - {this.state.ezSignIns.length}</Text>
        <Divider style={{height: 1}}/>
        {renderEZSignInList}
      </ScrollView>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
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
    fontSize: 18
  },
  testitemLoc:{
    color:"gray"
  },
  testitemPurpose:{
    flex:1,
    justifyContent: 'flex-end'
  },
  testbuttonContainer: {
    justifyContent: 'center'
  },
  signOutContainer: {
    width: 150,
    backgroundColor: 'red',
    alignSelf: "center",
    marginTop: 50,
  }
});

