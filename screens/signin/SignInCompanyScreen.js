import * as React from 'react';
import { StyleSheet, View, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import SearchList from '../../components/react-native-search-list';
import Touchable from '../../components/react-native-search-list/utils/Touchable';
import { Button } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const { width, height } = Dimensions.get('window');

export default class SignInCompanyScreen extends React.Component {
  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      isLoading: true,
      error: null
    };
    this.unsubscribeCompany = null;
  }

  async componentDidMount(){
    this._isMounted = true;
    try {
      const { isVisitor } = this.props.route.params;

      if(isVisitor){
        this.setState({ isLoading: true, error: null });
        this.unsubscribeCompany = firebase.firestore()
          .collection('CompanyProfiles')
          .onSnapshot(
            snapshot => {
              if (!this._isMounted) return;
              
              try {
                let companies = [];
                snapshot.docs.forEach(doc => {
                  const data = doc.data();
                  if (data && data.name) {
                    companies.push({
                      searchStr: data.name,
                      data: {
                        ...data,
                        id: doc.id
                      }
                    });
                  }
                });
                
                // Sort companies alphabetically
                companies.sort((a, b) => a.searchStr.localeCompare(b.searchStr));
                
                this.setState({
                  dataSource: companies,
                  isLoading: false,
                  error: null
                });
              } catch (error) {
                console.error("Error processing companies:", error);
                this.setState({
                  isLoading: false,
                  error: error.message
                });
              }
            },
            error => {
              console.error("Error fetching companies:", error);
              if (this._isMounted) {
                this.setState({
                  isLoading: false,
                  error: error.message
                });
              }
            }
          );
      }else if(isVisitor == false){
        this.unsubscribeCompany = firebase.firestore()
        .collection('Premises')
        .onSnapshot(snapshot => {
          let searchList = [];
          let premiseList = [];
          if(this._isMounted){
            snapshot.docs.forEach(doc => {
              let premiseName = doc.data().name
              if(premiseName.includes("(")){
                premiseName = premiseName.substring(0, premiseName.indexOf('('))
              }

              if(!premiseList.includes(premiseName.trim())){
                searchList.push({ 'searchStr' : premiseName.trim()})
                premiseList.push(premiseName.trim())
              }
            })
            this.setState({dataSource: searchList, isLoading: false})
          }
        }, error => {
          console.error("Error fetching premises:", error);
          this.setState({ isLoading: false, error: error.message });
        })
      }
      if(this.unsubscribeCompany != null)
        global.subscribers.push(this.unsubscribeCompany)
    } catch (error) {
      console.error("Error in componentDidMount:", error);
      this.setState({
        isLoading: false,
        error: error.message
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.unsubscribeCompany) {
      this.unsubscribeCompany();
    }
  }
  
  renderSearchList = () => {
    const { dataSource, isLoading, error } = this.state;

    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2F465B" />
          <Text style={styles.emptyText}>Loading companies...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, styles.errorText]}>
            {error}
          </Text>
        </View>
      );
    }

    return (
      <SearchList
        data={dataSource}
        renderRow={this.renderRow}
        cellHeight={50}
        sectionHeaderHeight={30}
        renderEmpty={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No companies found</Text>
          </View>
        )}
        renderEmptyResult={(searchStr) => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No results found for "{searchStr}"
            </Text>
          </View>
        )}
      />
    );
  }

  renderRow = (item, sectionId, index) => {
    if (!item || !item.searchStr) {
      console.warn('Invalid item in renderRow:', item);
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={() => this.onSelectCompany(item)}
      >
        <Text style={styles.rowText}>{item.searchStr}</Text>
      </TouchableOpacity>
    );
  }

  onSelectCompany = (item) => {
    if (!item || !item.searchStr) {
      console.warn('Invalid company selected:', item);
      return;
    }

    const { navigation, route } = this.props;
    const { isVisitor } = route.params;

    navigation.navigate('SignInPerson', {
      companyName: item.searchStr,
      companyData: item.data,
      isVisitor: isVisitor
    });
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <View style={styles.container}>
          {this.renderEmpty()}
        </View>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.searchListContainer}>
          {this.renderSearchList()}
        </View>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            style={styles.buttonWrapper}
        >
          <View style={styles.buttonVerticalContainer}>
            <View style={styles.buttonHorizontalContainer}>
              <View style={styles.buttonContainer}>
                {this.props.route.params.isVisitor && global.internetConnectivity ?
                <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() =>
                  this.props.navigation.navigate('OtherCompany')}>
                  NEW COMPANY
                </Button>
                : null}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  searchListContainer: {
    flex: 1,
    width: '100%',
  },
  buttonWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  rowContainer: {
    height: 40,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: '100%',
  },
  rowText: {
    fontSize: 16,
    color: '#000',
  },
  sectionHeader: {
    height: 40,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
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
    textAlign: 'center',
    marginTop: 10
  },
  errorText: {
    color: '#ff3b30'
  },
  buttonVerticalContainer:{
    justifyContent: 'flex-end',
    width: '100%',
  },
  buttonHorizontalContainer: {
    flexDirection: 'row-reverse',
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  buttonText: {
    justifyContent: 'center'
  }
})
