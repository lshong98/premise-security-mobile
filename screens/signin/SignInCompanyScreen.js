import * as React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import SearchList, { HighlightableText } from '../../components/react-native-search-list';
import Touchable from '../../components/react-native-search-list/utils/Touchable';
import { Text, Button } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export default class SignInCompanyScreen extends React.Component {
  _isMounted = false;
  constructor (props) {
    super(props)
    this.state = {
      dataSource: [],
    }
  }

  async componentDidMount(){
    let unsubscribeCompany = null;
    this._isMounted = true;
    const isVisitor = props.route.params.isVisitor;

    if(isVisitor){
      unsubscribeCompany = firebase.firestore()
      .collection('CompanyProfiles')
      .onSnapshot(snapshot => {
        let searchList = [];

        if(this._isMounted){
          snapshot.docs.forEach(doc => {
            searchList.push({ 'searchStr' : doc.data().name})
          })

          this.setState({dataSource: searchList})
        }
      })
    }else if(isVisitor == false){
      unsubscribeCompany = firebase.firestore()
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
          this.setState({dataSource: searchList})
        }
      })
    }
    if(unsubscribeCompany != null)
      global.subscribers.push(unsubscribeCompany)
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  
  renderRow (item, sectionID, rowID, highlightRowFunc, isSearching) {
    return (
      <Touchable onPress={() => {
        this.props.navigation.navigate('SignInPerson', {
          companyName: item.searchStr,
          isVisitor: props.route.params.isVisitor
        })
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
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}>{props.route.params.isVisitor ? "Loading Companies List" : "Loading Branch List"}</Text>
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

  renderSearchList = () => {
    return(
      <SearchList
        data={this.state.dataSource}
        renderRow={this.renderRow.bind(this)}
        renderEmptyResult={this.renderEmptyResult.bind(this)}
        renderBackButton={() => null}
        renderEmpty={this.renderEmpty.bind(this)}
        rowHeight={40}
        toolbarBackgroundColor={'#2F465B'}
        title={props.route.params.isVisitor ? 'PLEASE SELECT YOUR COMPANY' : 'PLEASE SELECT YOUR BRANCH'}
        cancelTitle={'Clear'}
        onClickBack={() => {}}
        searchListBackgroundColor={'#fff'}
        searchBarToggleDuration={300}
        searchInputBackgroundColor={'#f2f2f2'}
        searchInputBackgroundColorActive={'#f2f2f2'}
        searchInputPlaceholderColor={'#000'}
        searchInputTextColor={'#000'}
        searchInputTextColorActive={'#000'}
        searchInputPlaceholder={props.route.params.isVisitor ? 'Search Company' : 'Search Branch'}
        sectionIndexTextColor={'#000'}
        searchBarBackgroundColor={'#fff'}
      />
    )
  }

  render(){
    return (
      <View style={styles.container}>
        {this.renderSearchList()}
        <View style={styles.buttonVerticalContainer}>
          <View style={styles.buttonHorizontalContainer}>
            <View style={styles.buttonContainer}>
              {props.route.params.isVisitor && global.internetConnectivity ? 
              <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() => 
                this.props.navigation.navigate('OtherCompany')}>
                NEW COMPANY
              </Button>
              : null}
            </View>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  emptyDataSource: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50
  },
  emptySearchResult: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50
  },
  buttonVerticalContainer:{
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonHorizontalContainer: {
    flex: 1, 
    flexDirection: 'row-reverse',
    flexWrap: "wrap",
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
