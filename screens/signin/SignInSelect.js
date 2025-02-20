import * as React from 'react';
import { StyleSheet, View, Dimensions, Alert } from 'react-native';
import { Button, Text, Switch } from 'react-native-paper';
import { openBrowserAsync } from 'expo-web-browser';

const { height, width } = Dimensions.get('screen');
export default class HomeScreen extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      consent: false,
      isShowingError: false
    }
  }

  visitorSignInRequest = () => {
    if (!this.state.isShowingError) {
      if (!global.premiseLocation) {
        this.setState({ isShowingError: true }, () => {
          Alert.alert(
            'Error',
            'Please select a premise location first.',
            [{ 
              text: 'OK',
              onPress: () => {
                this.setState({ isShowingError: false });
                this.props.navigation.navigate('Location');
              }
            }],
            { cancelable: false }
          );
        });
        return;
      }

      if (!this.state.consent) {
        this.setState({ isShowingError: true }, () => {
          Alert.alert(
            'Error',
            'Please give us consent to use your information.',
            [{ 
              text: 'OK',
              onPress: () => this.setState({ isShowingError: false })
            }],
            { cancelable: false }
          );
        });
        return;
      }

      this.props.navigation.navigate('SignInCompany', {
        isVisitor: true
      });
    }
  }

  staffSignInRequest = () => {
    if (!this.state.isShowingError) {
      if (!global.premiseLocation) {
        this.setState({ isShowingError: true }, () => {
          Alert.alert(
            'Error',
            'Please select a premise location first.',
            [{ 
              text: 'OK',
              onPress: () => {
                this.setState({ isShowingError: false });
                this.props.navigation.navigate('Location');
              }
            }],
            { cancelable: false }
          );
        });
        return;
      }

      if (!this.state.consent) {
        this.setState({ isShowingError: true }, () => {
          Alert.alert(
            'Error',
            'Please give us consent to use your information.',
            [{ 
              text: 'OK',
              onPress: () => this.setState({ isShowingError: false })
            }],
            { cancelable: false }
          );
        });
        return;
      }

      this.props.navigation.navigate('SignInCompany', {
        isVisitor: false
      });
    }
  }

  _onToggleSwitch = () => this.setState({ consent: !this.state.consent });

  privacyPolicyLink = () => {
    openBrowserAsync("http://trienekens.com.my/terms-of-use-and-privacy-policy/")
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
        <Button style={styles.button} buttonColor='rgb(21, 31, 53)' mode="contained" onPress={() => this.privacyPolicyLink()}>
          PRIVACY POLICY
        </Button>
        <View style={styles.consentContainer}>
          <Switch
            value={this.state.consent}
            onValueChange={this._onToggleSwitch}
          />
          <Text style={styles.consentText}>I consent to the processing of my personal data pursuant to Trienekens’ Personal Data Protection Notice and further confirm that I have read, understood and accepted the term stated therein.</Text>
        </View>
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
  consentContainer:{
    width: width * 0.8,
    marginTop: 30,
    flexDirection: "row",
    alignSelf: 'center'
  },
  consentText:{
    fontSize: 12,
    flex: 1,
    marginLeft: 5,
    flexWrap: 'wrap'
  },
})
