import * as React from 'react';
import { StyleSheet, View, Alert, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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
      filteredVisitorList: [],
      isLoading: true,
      error: null
    }
    this.unsubscribeVisitor = null;
    this.unsubscribeStaff = null;
  }
  
  async componentDidMount(){
    this._isMounted = true;
    try {
      const { isVisitor, companyName } = this.props.route.params;
      
      if (!isVisitor) {
        this.unsubscribeStaff = firebase.firestore()
          .collection('StaffProfiles')
          .onSnapshot(
            snapshot => {
              if (!this._isMounted) return;
              
              try {
                const allStaffs = [];
                const filteredStaffList = [];
                
                snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  allStaffs.push(data);
                  
                  if (data.branch === companyName) {
                    filteredStaffList.push({
                      searchStr: data.name,
                      contact_no: data.contact_no
                    });
                  }
                });
                
                this.setState({
                  allStaffs,
                  filteredStaffList,
                  isLoading: false,
                  error: null
                });
              } catch (error) {
                console.error('Error processing staff data:', error);
                this.setState({
                  isLoading: false,
                  error: 'Failed to load staff data'
                });
              }
            },
            error => {
              console.error('Firestore staff error:', error);
              this.setState({
                isLoading: false,
                error: 'Failed to connect to database'
              });
            }
          );
      } else {
        this.unsubscribeVisitor = firebase.firestore()
          .collection('VisitorProfiles')
          .onSnapshot(
            snapshot => {
              if (!this._isMounted) return;
              
              try {
                const allVisitors = [];
                const filteredVisitorList = [];
                
                snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  allVisitors.push(data);
                  
                  if (data.company === companyName) {
                    filteredVisitorList.push({
                      searchStr: data.name,
                      contact_no: data.contact_no
                    });
                  }
                });
                
                this.setState({
                  allVisitors,
                  filteredVisitorList,
                  isLoading: false,
                  error: null
                });
              } catch (error) {
                console.error('Error processing visitor data:', error);
                this.setState({
                  isLoading: false,
                  error: 'Failed to load visitor data'
                });
              }
            },
            error => {
              console.error('Firestore visitor error:', error);
              this.setState({
                isLoading: false,
                error: 'Failed to connect to database'
              });
            }
          );
      }

      if (this.unsubscribeStaff) {
        global.subscribers.push(this.unsubscribeStaff);
      }
      if (this.unsubscribeVisitor) {
        global.subscribers.push(this.unsubscribeVisitor);
      }
    } catch (error) {
      console.error('ComponentDidMount error:', error);
      this.setState({
        isLoading: false,
        error: 'An unexpected error occurred'
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.unsubscribeStaff) {
      this.unsubscribeStaff();
    }
    if (this.unsubscribeVisitor) {
      this.unsubscribeVisitor();
    }
  }
  
  checkIfPersonAlreadySignedIn = async (item) => {
    try {
      if (!item?.searchStr) {
        console.warn('Invalid item in checkIfPersonAlreadySignedIn:', item);
        return;
      }

      const { navigation, route } = this.props;
      const { isVisitor, companyName } = route.params;
      const personName = item.searchStr;

      let signedIn = true;
      
      if (global.internetConnectivity) {
        const snapshot = await firebase.firestore()
          .collection('Entries')
          .where("name", "==", personName)
          .where("company", "==", companyName)
          .where("sign_out_time", "==", "")
          .where('premise', '==', global.premiseLocation)
          .get();
          
        signedIn = !snapshot.empty;
      } else {
        const signedInArray = [];
        const source = isVisitor ? visitorSource : staffSource;
        
        source.forEach((person) => {
          if (person.company === companyName && person.name === personName) {
            signedInArray.push(person);
          }
        });
        
        signedIn = signedInArray.length > 0;
      }

      if (!signedIn) {
        if (!isVisitor) {
          if (global.internetConnectivity) {
            navigation.navigate('PictureSignIn', {
              companyName,
              contactNo: item.contact_no,
              personName,
              isVisitor
            });
          } else {
            await this.submitOfflineStaffData(
              companyName,
              item.contact_no,
              personName
            );
          }
        } else {
          navigation.navigate('EntrySignIn', {
            companyName,
            contactNo: item.contact_no,
            personName,
            isVisitor
          });
        }
      } else {
        Alert.alert(
          'Already Signed In',
          'You are already signed in',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error in checkIfPersonAlreadySignedIn:', error);
      Alert.alert(
        'Error',
        'Failed to check sign-in status. Please try again.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  }

  submitOfflineStaffData = async (company, contactNo, name) => {
    try {
      const { navigation } = this.props;
      
      await firebase.firestore()
        .collection('Entries')
        .add({
          company,
          name,
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
      console.error('Error in submitOfflineStaffData:', error);
      Alert.alert(
        'Error',
        'Failed to create entry. Please try again.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  }

  renderRow = (item, sectionID, rowID, highlightRowFunc, isSearching) => {
    if (!item?.searchStr) {
      console.warn('Invalid item in renderRow:', item);
      return null;
    }

    return (
      <Touchable 
        onPress={() => this.checkIfPersonAlreadySignedIn(item)}
        style={styles.rowTouchable}
      >
        <View style={styles.rowContainer}>
          <HighlightableText
            matcher={item.matcher}
            text={item.searchStr}
            textColor={'#000'}
            hightlightTextColor={'#0069c0'}
          />
        </View>
      </Touchable>
    );
  }

  renderEmpty = () => {
    return (
      <View style={styles.emptyDataSource}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No users registered under this company. </Text>
      </View>
    )
  }

  renderEmptyResult = (searchStr) => {
    return (
      <View style={styles.emptySearchResult}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No Result For <Text
          style={{color: '#171a23', fontSize: 18}}>{searchStr}</Text></Text>
        <Text style={{color: '#979797', fontSize: 18, alignItems: 'center', paddingTop: 10}}>Please search again</Text>
      </View>
    )
  }

  render() {
    const { 
      filteredStaffList,
      filteredVisitorList,
      isLoading,
      error
    } = this.state;
    const { isVisitor } = this.props.route.params;
    
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2F465B" />
          <Text style={styles.loadingText}>
            Loading {isVisitor ? 'visitors' : 'staff'}...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained"
            onPress={() => this.componentDidMount()}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.searchListContainer}>
            <SearchList
              data={isVisitor ? filteredVisitorList : filteredStaffList}
              renderRow={this.renderRow}
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
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#2F465B'
  },
  rowContainer: {
    flex: 1,
    marginLeft: 20,
    height: 40,
    justifyContent: 'center'
  },
  rowTouchable: {
    flex: 1
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
  emptySearchResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  }
})
