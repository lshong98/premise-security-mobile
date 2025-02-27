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
      isLoadingMore: false,
      error: null,
      lastDoc: null,
      hasMore: true,
      loadingProgress: 0,
      isSearching: false,
      searchText: ''
    };
    this.loadTimer = null;
  }

  async componentDidMount(){
    this._isMounted = true;
    try {
      const { isVisitor } = this.props.route.params;
      this.setState({ isLoading: true, error: null });

      if(isVisitor){
        await this.loadInitialCompanies();
        this.startProgressiveLoading();
      } else {
        // For premises, also use get() instead of onSnapshot
        const snapshot = await firebase.firestore()
          .collection('Premises')
          .orderBy('name')  // Add server-side ordering
          .limit(100)       // Add pagination
          .get();
        
        if (!this._isMounted) return;
        
        try {
          let searchList = [];
          let premiseList = new Set();  // Use Set for better performance
          
          snapshot.docs.forEach(doc => {
            let premiseName = doc.data().name;
            if(premiseName.includes("(")){
              premiseName = premiseName.substring(0, premiseName.indexOf('(')).trim();
            }
            
            if(!premiseList.has(premiseName)){
              searchList.push({ 'searchStr': premiseName });
              premiseList.add(premiseName);
            }
          });
          
          this.setState({
            dataSource: searchList,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error("Error processing premises:", error);
          this.setState({
            isLoading: false,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error("Error in componentDidMount:", error);
      if (this._isMounted) {
        this.setState({
          isLoading: false,
          error: error.message
        });
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }
  }

  loadInitialCompanies = async () => {
    try {
      const snapshot = await firebase.firestore()
        .collection('CompanyProfiles')
        .orderBy('name')
        .limit(50)
        .get();

      if (!this._isMounted) return;

      const companies = this.processCompanyDocs(snapshot.docs);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      this.setState({
        dataSource: companies,
        lastDoc,
        isLoading: false,
        loadingProgress: 0
      });
    } catch (error) {
      console.error("Error loading initial companies:", error);
      this.setState({
        isLoading: false,
        error: "Failed to load companies"
      });
    }
  }

  processCompanyDocs = (docs) => {
    return docs.map(doc => {
      const data = doc.data();
      return {
        searchStr: data.name,
        data: {
          ...data,
          id: doc.id
        }
      };
    }).sort((a, b) => a.searchStr.localeCompare(b.searchStr));
  }

  loadMoreCompanies = async () => {
    if (!this.state.hasMore || this.state.isLoadingMore) return;

    try {
      this.setState({ isLoadingMore: true });

      const snapshot = await firebase.firestore()
        .collection('CompanyProfiles')
        .orderBy('name')
        .startAfter(this.state.lastDoc)
        .limit(50)
        .get();

      if (!this._isMounted) return;

      if (snapshot.empty) {
        this.setState({ 
          hasMore: false, 
          isLoadingMore: false,
          loadingProgress: 100 
        });
        if (this.loadTimer) {
          clearTimeout(this.loadTimer);
        }
        return;
      }

      const newCompanies = this.processCompanyDocs(snapshot.docs);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      this.setState(prevState => ({
        dataSource: [...prevState.dataSource, ...newCompanies],
        lastDoc,
        isLoadingMore: false,
        loadingProgress: Math.min(prevState.loadingProgress + 10, 100)
      }));
    } catch (error) {
      console.error("Error loading more companies:", error);
      this.setState({ 
        isLoadingMore: false,
        error: "Failed to load more companies"
      });
    }
  }

  startProgressiveLoading = () => {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
    }
    
    this.loadTimer = setInterval(() => {
      // Only load more if not searching and there's more to load
      if (!this.state.isSearching && this.state.hasMore && !this.state.isLoadingMore) {
        this.loadMoreCompanies();
      }
    }, 1000);
  }

  handleSearch = (text) => {
    this.setState({ 
      isSearching: text.length > 0,
      searchText: text
    });
    
    // Pause loading when searching
    if (text.length > 0) {
      if (this.loadTimer) {
        clearTimeout(this.loadTimer);
        this.loadTimer = null;
      }
    } else {
      // Resume loading when search is cleared
      this.startProgressiveLoading();
    }
  }

  renderSearchList = () => {
    const { 
      dataSource, 
      isLoading, 
      error, 
      loadingProgress,
      hasMore 
    } = this.state;
    
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2F465B" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <SearchList
          data={dataSource}
          renderRow={this.renderRow}
          cellHeight={50}
          sectionHeaderHeight={30}
          renderEmpty={this.renderEmpty}
          toolbarBackgroundColor={'#2F465B'}
          title={'SELECT COMPANY'}
          cancelTitle={'Clear'}
          searchBarBackgroundColor={'#fff'}
          searchInputBackgroundColor={hasMore ? '#e0e0e0' : '#f2f2f2'}
          searchInputBackgroundColorActive={hasMore ? '#e0e0e0' : '#f2f2f2'}
          searchInputPlaceholderColor={'#666'}
          searchInputTextColor={'#000'}
          searchInputTextColorActive={'#000'}
          searchInputPlaceholder={hasMore ? 'Please wait, loading all companies...' : 'Search Company'}
          sectionIndexTextColor={'#000'}
          editable={!hasMore}
        />
        {hasMore && loadingProgress < 100 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Loading companies ({loadingProgress}%)...
            </Text>
            <ActivityIndicator size="small" color="#2F465B" />
          </View>
        )}
      </View>
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
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    marginRight: 10
  }
})
