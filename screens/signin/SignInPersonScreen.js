import * as React from 'react';
import { StyleSheet, View, Alert, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import SearchList, { HighlightableText } from '../../components/react-native-search-list';
import Touchable from '../../components/react-native-search-list/utils/Touchable';
import { Text, Button } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {visitorSource} from '../HomeScreen';
import {staffSource} from '../HomeScreen';

const { width, height } = Dimensions.get('window');

export default class SignInPersonScreen extends React.Component {
  _isMounted = false;
  constructor (props) {
    super(props)
    this.state = {
      dataSource: [],
      allStaffs: [],
      allVisitors: [],
      filteredStaffList: [],
      filteredVisitorList: []
    }
  }
  
  async componentDidMount(){
    this._isMounted = true;
    let unsubscribeVisitor = null;
    let unsubscribeStaff = null;

    const isVisitor = this.props.route.params.isVisitor;
    const company = this.props.route.params.companyName;

    if(isVisitor == false){
      unsubscribeStaff = firebase.firestore()
      .collection('StaffProfiles')
      .onSnapshot(snapshot => {
        if(this._isMounted){
          let allStaffs = [];
          let filteredStaffList = [];
          snapshot.docs.forEach(doc => {
            allStaffs.push(doc.data())

            if(doc.data().branch === company){
              filteredStaffList.push({ 'searchStr' : doc.data().name, contact_no: doc.data().contact_no})
            }
          })
          this.setState({allStaffs: allStaffs, filteredStaffList: filteredStaffList})
        }
      })
    } else if (isVisitor) {
      unsubscribeVisitor = firebase.firestore()
      .collection('VisitorProfiles')
      .onSnapshot(snapshot => {
        if(this._isMounted){
          let allVisitors = [];
          let filteredVisitorList = [];
          snapshot.docs.forEach(doc => {
            allVisitors.push(doc.data())

            if(doc.data().company === company){
              filteredVisitorList.push({ 'searchStr' : doc.data().name, contact_no: doc.data().contact_no})
            }
          })
          this.setState({allVisitors: allVisitors, filteredVisitorList: filteredVisitorList})
        }
      })
    }

    if(unsubscribeStaff != null)
      global.subscribers.push(unsubscribeStaff)
    if(unsubscribeVisitor != null)
      global.subscribers.push(unsubscribeVisitor)
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  
  checkIfPersonAlreadySignedIn = async (item) => {
    const { navigation } = this.props;
    const isVisitor = this.props.route.params.isVisitor;
    let companyExist = this.props.route.params.companyName;
    let personExist = item.searchStr;

    let signedIn = true;
    if(global.internetConnectivity){
       await firebase.firestore()
        .collection('Entries')
        .where("name", "==", personExist)
        .where("company", "==", companyExist)
        .where("sign_out_time", "==", "")
        .where('premise', '==', global.premiseLocation)
        .get()
        .then(snapshot => {
          if(snapshot.empty){
            signedIn = false;
          }
        })
    }else{
      let signedInArray = [];

      if(isVisitor){
        visitorSource.forEach((visitor) => {
          if(visitor.company === companyExist && visitor.name === personExist){
            signedInArray.push(visitor)
          }
        })
      }else{
        staffSource.forEach((staff) => {
          if(staff.company === companyExist && staff.name === personExist){
            signedInArray.push(visitor)
          }
        })
      }

      if(signedInArray.length === 0){
        signedIn = false;
      }
    }

    if(signedIn == false){
      if(!isVisitor && global.internetConnectivity){
        this.props.navigation.navigate('PictureSignIn', {
          companyName: this.props.route.params.companyName,
          contactNo: item.contact_no,
          personName: item.searchStr,
          isVisitor: isVisitor
        })
      }else if(!isVisitor && !global.internetConnectivity){
        this.submitOfflineStaffData(
          this.props.route.params.companyName,
          item.contact_no,
          item.searchStr
        );
      }else if(isVisitor == true){
        this.props.navigation.navigate('EntrySignIn', {
          companyName: this.props.route.params.companyName,
          contactNo: item.contact_no,
          personName: item.searchStr,
          isVisitor: isVisitor,
        })
      }
    }else{
      alert(`You are already signed in`)
    }
  }

  submitOfflineStaffData = async (company, contactNo, name) => {
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
        sign_out_photo: '',
        carPlateNo: '',
        isVisitor: this.props.route.params.isVisitor
      }).then(() => {
        let counterRef = firebase.firestore().collection('Counters').doc('Entries');
        counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
      }).catch(error => {
        Alert.alert(error)
      })
    
    navigation.navigate('HomeSignOut')
    Alert.alert("Entry created.")
  }

  renderRow (item, sectionID, rowID, highlightRowFunc, isSearching) {
    const isVisitor = this.props.route.params.isVisitor;

    return (
      <Touchable onPress={() => {
        this.checkIfPersonAlreadySignedIn(item);
      }}>
        <View key={rowID} style={{flex: 1, marginLeft: 20, height: 40, justifyContent: 'center'}}>
          <HighlightableText
            matcher={item.matcher}
            text={item.searchStr}
            textColor={'#000'}
            hightlightTextColor={'#0069c0'}
          />
        </View>
      </Touchable>
    )
  }

  renderEmpty () {
    return (
      <View style={styles.emptyDataSource}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No users registered under this company. </Text>
      </View>
    )
  }

  renderEmptyResult (searchStr) {
    return (
      <View style={styles.emptySearchResult}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No Result For <Text
          style={{color: '#171a23', fontSize: 18}}>{searchStr}</Text></Text>
        <Text style={{color: '#979797', fontSize: 18, alignItems: 'center', paddingTop: 10}}>Please search again</Text>
      </View>
    )
  }

  render () {
    const { isVisitor } = this.props.route.params;
    const dataSource = isVisitor ? this.state.filteredVisitorList : this.state.filteredStaffList;

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.searchListContainer}>
            <SearchList
              data={dataSource}
              renderRow={(item, sectionId, rowId) => this.renderRow(item, sectionId, rowId)}
              cellHeight={50}
              sectionHeaderHeight={30}
              renderEmpty={this.renderEmpty}
              toolbarBackgroundColor={'#2F465B'}
              title={isVisitor ? 'SELECT YOUR NAME' : 'SELECT YOUR NAME'}
              cancelTitle={'Clear'}
              searchBarBackgroundColor={'#fff'}
              searchInputBackgroundColor={'#f2f2f2'}
              searchInputBackgroundColorActive={'#f2f2f2'}
              searchInputPlaceholderColor={'#666'}
              searchInputTextColor={'#000'}
              searchInputTextColorActive={'#000'}
              searchInputPlaceholder={'Search Name'}
              sectionIndexTextColor={'#000'}
              hideSectionList={false}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  searchListContainer: {
    flex: 1
  },
  emptyDataSource: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  rowContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  rowText: {
    fontSize: 16,
    color: '#333'
  },
  sectionHeader: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666'
  }
})
