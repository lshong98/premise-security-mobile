import * as React from 'react';
import { StyleSheet, View, Dimensions, SafeAreaView, KeyboardAvoidingView, Platform, Text, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import SearchList from '../../components/react-native-search-list';
import SearchBar from '../../components/react-native-search-list/components/SearchBar';
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
      isLoading: false,
      isLoadingMore: false,
      error: null,
      lastDoc: null,
      hasMore: false,
      loadingProgress: 0,
      isSearching: false,
      searchText: ''
    };
    this.loadTimer = null;
    this.searchTimer = null;
  }

  async componentDidMount(){
    this._isMounted = true;
    try {
      const { isVisitor } = this.props.route.params;
      this.setState({ isLoading: false, error: null });

      if(isVisitor){
        // Don't load all companies on mount - wait for user to search
        // Show empty state with search prompt instead
        this.setState({
          isLoading: false,
          dataSource: []
        });
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

      console.log(`[PERFORMANCE] Initial companies loaded: ${companies.length}`);

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

      this.setState(prevState => {
        const totalCompanies = prevState.dataSource.length + newCompanies.length;
        console.log(`[PERFORMANCE] Total companies loaded: ${totalCompanies} (added ${newCompanies.length})`);

        return {
          dataSource: [...prevState.dataSource, ...newCompanies],
          lastDoc,
          isLoadingMore: false,
          loadingProgress: Math.min(prevState.loadingProgress + 10, 100)
        };
      });
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

  handleSearch = async (text) => {
    console.log(`[SEARCH] handleSearch called with: "${text}"`);

    this.setState({
      isSearching: text.length > 0,
      searchText: text
    });

    // Clear any existing timers
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }

    // If search is empty, clear results
    if (!text || text.length === 0) {
      console.log('[SEARCH] Empty search, clearing results');
      this.setState({ dataSource: [] });
      return;
    }

    // Only search when user types at least 2 characters
    if (text.length < 2) {
      console.log('[SEARCH] Less than 2 characters, waiting...');
      return;
    }

    // Debounce the search
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    console.log('[SEARCH] Setting up debounce timer');
    this.searchTimer = setTimeout(async () => {
      console.log('[SEARCH] Debounce complete, calling searchCompanies');
      await this.searchCompanies(text);
    }, 300); // Wait 300ms after user stops typing
  }

  searchCompanies = async (searchText) => {
    try {
      console.log(`[SEARCH] searchCompanies called with: "${searchText}"`);
      this.setState({ isLoading: true });

      // Capitalize first letter to match most company names
      const capitalizedSearch = searchText.charAt(0).toUpperCase() + searchText.slice(1);
      console.log(`[SEARCH] Searching with capitalized: "${capitalizedSearch}"`);

      // Search using range query for prefix search
      console.log('[SEARCH] Querying Firestore...');
      const snapshot = await firebase.firestore()
        .collection('CompanyProfiles')
        .orderBy('name')
        .where('name', '>=', capitalizedSearch)
        .where('name', '<=', capitalizedSearch + '\uf8ff')
        .limit(50)
        .get();

      console.log(`[SEARCH] Firestore returned ${snapshot.docs.length} docs`);

      if (!this._isMounted) return;

      const companies = this.processCompanyDocs(snapshot.docs);

      console.log(`[PERFORMANCE] Search for "${searchText}" returned ${companies.length} companies`);

      this.setState({
        dataSource: companies,
        isLoading: false
      });
    } catch (error) {
      console.error("[SEARCH] Error searching companies:", error);
      this.setState({
        isLoading: false,
        error: "Search failed. Please try again."
      });
    }
  }

  renderSearchList = () => {
    const {
      dataSource = [],
      isLoading = false,
      error = null,
      searchText = ''
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
      <View style={styles.fullContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>SELECT COMPANY</Text>
        </View>
        <SearchBar
          placeholder={'Type to search company...'}
          onChange={this.handleSearch}
          value={searchText}
          searchBarBackgroundColor={'#fff'}
          searchInputBackgroundColor={'#f2f2f2'}
          searchInputPlaceholderColor={'#666'}
          searchInputTextColor={'#000'}
          searchInputTextColorActive={'#000'}
          cancelTitle={'Done'}
        />

        <View style={styles.contentContainer}>
          {dataSource.length > 0 && (
            <FlatList
              data={dataSource}
              renderItem={({ item }) => this.renderRow(item)}
              keyExtractor={(item, index) => item.searchStr + index}
              style={styles.flatList}
            />
          )}

          {dataSource.length === 0 && !isLoading && searchText.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Type in the search box above to find a company
              </Text>
              <Text style={styles.emptySubtext}>
                (At least 2 characters)
              </Text>
            </View>
          )}
          {dataSource.length === 0 && !isLoading && searchText.length >= 2 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No companies found matching "{searchText}"
              </Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
            </View>
          )}
        </View>
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
  fullContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#2F465B',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5
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
