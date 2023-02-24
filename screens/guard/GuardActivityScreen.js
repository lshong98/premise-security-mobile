import * as React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Divider, Text, List, Button } from 'react-native-paper';
import { Block } from '../../components';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export default class GuardActivityScreen extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      loading: true,
      dataSource: [],
    }
  } 

  async componentDidMount(){
    this._isMounted = true;

    let premise = global.premiseLocation;
    if(premise.includes("(")){
      premise = global.premiseLocation.substring(0, global.premiseLocation.indexOf("(")).trim()
    }

    let unsubscribeGuardActivity = firebase.firestore()
    .collection('Patrols')
    .where('premise', '==', premise)
    .where('name', '==', global.currentGuardOnDuty )
    .orderBy("patrol_time", "desc")
    .limit(25)
    .onSnapshot(snapshot => {
        var data = snapshot.docs.map(doc => ({
          area: doc.data().area, 
          premise: doc.data().premise, 
          patrol_time: doc.data().patrol_time.toDate().toISOString(), 
        }));
        this.setState({loading: false, dataSource: data})
      }
    )
    global.subscribers.push(unsubscribeGuardActivity)
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  renderList = () => {
    let renderPatrolsList = this.state.dataSource.map((patrol, key) => {
      return(
        <TouchableWithoutFeedback key={key}>
          <Block>
          <Divider/>
          <Block style={styles.testitemContainer}>
            
            <View style={{flex:1}}>
              <Text style={styles.testitemName} numberOfLines={1}>{patrol.area}</Text>
              <Text style={styles.testitemLoc} numberOfLines={1}>{patrol.premise}</Text>
              <Text style={styles.testitemLoc} numberOfLines={1}>{new Date(patrol.patrol_time).toLocaleDateString("en-US")} - {new Date(patrol.patrol_time).toLocaleTimeString("en-US")}</Text>
            </View>
            
          </Block>
          </Block>
        </TouchableWithoutFeedback>
      );
    })

    return(
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
        <Text style={styles.testlistTitle}>GUARD PATROL ACTIVITY — {global.currentGuardOnDuty.toUpperCase()}</Text>
        <Divider style={{height: 1}}/>
        {renderPatrolsList}

        <View style={styles.backContainer}>
          <Button icon='logout' buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.props.navigation.goBack()}>
            BACK
          </Button>
        </View>
      </ScrollView>
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
  testlistTitle:{
    fontSize: 20,
    marginVertical: 10,
    fontWeight: 'bold'
  },
  testitemContainer:{
    marginVertical: 15,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testitemName:{
    fontSize: 20
  },
  testitemLoc:{
    marginTop: 2.5,
    fontSize: 12
  },
  testitemPurpose:{
    flex:1,
    justifyContent: 'flex-end'
  },
  testbuttonContainer: {
    justifyContent: 'center'
  },
  backContainer: {
    alignSelf: 'center',
    bottom: 0,
    marginVertical: 30,
  }
});

