import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default class HomeScreen extends React.Component{
  constructor(props){
    super(props);
  } 

  visitorSignInRequest = () => {
    this.props.navigation.navigate('SignInCompany', {
      isVisitor: true
    })
  }

  staffSignInRequest = () => {
    this.props.navigation.navigate('SignInCompany', {
      isVisitor: false
    })
  }

  render(){
    return(
      <View style={styles.container}>
        <Text style={styles.testbranchTitle}>Premise {'\n'}— {global.premiseLocation}</Text>
        <Button icon="account" style={styles.button} buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.visitorSignInRequest()}>
          VISITOR SIGN-IN
        </Button>
        <Button icon="account-check" style={styles.button} buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.staffSignInRequest()}>
          STAFF SIGN-IN
        </Button>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 60,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  button: {
    marginVertical: 15
  },
  testbranchTitle:{
    color: 'gray',
    textAlign: 'right',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 10,
    marginBottom: 20,
  },
})