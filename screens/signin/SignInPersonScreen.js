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
      isLoadingMore: false,
      error: null,
      lastDoc: null,
      hasMore: true
    }
  }
  
  async componentDidMount(){
    this._isMounted = true;
    try {
      const { isVisitor, companyName } = this.props.route.params;
      
      if (!isVisitor) {
        const snapshot = await firebase.firestore()
          .collection('StaffProfiles')
          .where('branch', '==', companyName)
          .limit(100)
          .get();
          
        if (!this._isMounted) return;
        
        try {
          const allStaffs = [];
          const filteredStaffList = [];
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allStaffs.push(data);
            filteredStaffList.push({
              searchStr: data.name,
              contact_no: data.contact_no
            });
          });
          
          this.setState({
            allStaffs,
            filteredStaffList,
            isLoading: false,
            error: null,
            lastDoc: snapshot.docs[snapshot.docs.length - 1]
          });
        } catch (error) {
          console.error('Error processing staff data:', error);
          this.setState({
            isLoading: false,
            error: 'Failed to load staff data'
          });
        }
      } else {
        const snapshot = await firebase.firestore()
          .collection('VisitorProfiles')
          .where('company', '==', companyName)
          .limit(100)
          .get();
          
        if (!this._isMounted) return;
        
        try {
          const allVisitors = [];
          const filteredVisitorList = [];
          
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            allVisitors.push(data);
            filteredVisitorList.push({
              searchStr: data.name,
              contact_no: data.contact_no
            });
          });
          
          this.setState({
            allVisitors,
            filteredVisitorList,
            isLoading: false,
            error: null,
            lastDoc: snapshot.docs[snapshot.docs.length - 1]
          });
        } catch (error) {
          console.error('Error processing visitor data:', error);
          this.setState({
            isLoading: false,
            error: 'Failed to load visitor data'
          });
        }
      }
    } catch (error) {
      console.error('ComponentDidMount error:', error);
      if (this._isMounted) {
        this.setState({
          isLoading: false,
          error: 'An unexpected error occurred'
        });
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
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

  loadMore = async () => {
    if (this.state.isLoadingMore || !this.state.hasMore) return;
    
    try {
      this.setState({ isLoadingMore: true });
      const { isVisitor, companyName } = this.props.route.params;
      
      let query = firebase.firestore()
        .collection(isVisitor ? 'VisitorProfiles' : 'StaffProfiles')
        .where(isVisitor ? 'company' : 'branch', '==', companyName)
        .orderBy('name')
        .limit(50);
        
      if (this.state.lastDoc) {
        query = query.startAfter(this.state.lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (!this._isMounted) return;
      
      if (snapshot.empty) {
        this.setState({ hasMore: false, isLoadingMore: false });
        return;
      }
      
      const newDocs = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        newDocs.push({
          searchStr: data.name,
          contact_no: data.contact_no
        });
      });
      
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      if (isVisitor) {
        this.setState(prevState => ({
          filteredVisitorList: [...prevState.filteredVisitorList, ...newDocs],
          lastDoc,
          isLoadingMore: false
        }));
      } else {
        this.setState(prevState => ({
          filteredStaffList: [...prevState.filteredStaffList, ...newDocs],
          lastDoc,
          isLoadingMore: false
        }));
      }
    } catch (error) {
      console.error('Error loading more:', error);
      this.setState({ 
        isLoadingMore: false,
        error: 'Failed to load more data'
      });
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

  renderFooter = () => {
    if (!this.state.isLoadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#2F465B" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  }

  renderSearchList = () => {
    const { 
      filteredStaffList,
      filteredVisitorList,
      isLoading,
      error,
      hasMore 
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

    return (
      <SearchList
        data={isVisitor ? filteredVisitorList : filteredStaffList}
        renderRow={this.renderRow}
        cellHeight={50}
        sectionHeaderHeight={30}
        renderEmpty={this.renderEmpty}
        renderFooter={this.renderFooter}
        onEndReached={hasMore ? this.loadMore : null}
        onEndReachedThreshold={0.5}
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
    );
  }

  render() {
    const { 
      filteredStaffList,
      filteredVisitorList,
      isLoading,
      error,
      hasMore
    } = this.state;
    
    const { isVisitor } = this.props.route.params;

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.mainContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.searchListContainer}>
            {this.renderSearchList()}
          </View>
          <View style={styles.buttonVerticalContainer}>
            <View style={styles.buttonHorizontalContainer}>
              <View style={styles.buttonContainer}>
                <Button 
                  style={styles.buttonText} 
                  buttonColor={"#2F465B"} 
                  mode="contained" 
                  onPress={() => this.props.navigation.goBack()}
                >
                  BACK
                </Button>
              </View>
              {global.internetConnectivity && (
                <View style={styles.buttonContainer}>
                  <Button 
                    style={styles.buttonText} 
                    buttonColor={"#2F465B"} 
                    mode="contained" 
                    onPress={() => this.props.navigation.navigate('OtherPerson', {
                      companyName: this.props.route.params.companyName,
                      isVisitor: this.props.route.params.isVisitor
                    })}
                  >
                    NEW PERSON
                  </Button>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  searchListContainer: {
    flex: 1,
    backgroundColor: '#fff'
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
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2F465B'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    margin: 20
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
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
});
