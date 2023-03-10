import * as React from 'react';
import { StyleSheet, View, Dimensions, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const { height, width } = Dimensions.get('screen');
export default class OutsiderVehicleRecordScreen extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
        park_time: '',
        leave_time: '',
        vehicle_type: '',
        vehicle_color: '',
        vehicle_number: '',
        remark: '',
        recorder: '',
        premise: '',
        parkTimePickerShow: false,
        leaveTimePickerShow: false,
        park_time_date: new Date(),
        leave_time_date: new Date(),
    }
  }

  checkForm = () => {

    if (this.state.park_time == ''){
        Alert.alert("Park time cannot be empty")
    } else if (this.state.vehicle_type == ''){
        Alert.alert("Vehicle Type cannot be empty")
    } else if (this.state.vehicle_color == ''){
        Alert.alert("Vehicle Color cannot be empty")
    } else if (this.state.vehicle_number == ''){
        Alert.alert("Vehicle Number cannot be empty")
    } else {
        firebase.firestore()        
        .collection('OutsiderVehicleRecords')
        .add({
            park_time: this.state.park_time,
            leave_time: this.state.leave_time,
            vehicle_type: this.state.vehicle_type,
            vehicle_color: this.state.vehicle_color,
            vehicle_number: this.state.vehicle_number,
            remark: this.state.remark,
            recorder: global.currentGuardOnDuty,
            premise: global.premiseLocation,
            submit_time: firebase.firestore.Timestamp.fromDate(new Date()),        
        }).then(() => {
            let counterRef = firebase.firestore().collection('Counters').doc('OutsiderVehicleRecords');
            counterRef.update({ "counter": firebase.firestore.FieldValue.increment(1) });
        })
        Alert.alert("Entry created.")
        this.props.navigation.goBack()
    }
  }


  render(){    
    return (
      <KeyboardAvoidingView style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',}} behavior="padding" enabled   keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Park Time</Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.datePickerValueField}
                editable={false}
                selectTextOnFocus={false}
                value={this.state.park_time}
                onPressIn={()=>{this.setState({ parkTimePickerShow: true })}}
            />
            <Button style={styles.datePickerButtonField} buttonColor={"#2F465B"} mode="contained" onPress={() => this.setState({ parkTimePickerShow: false, park_time: this.state.park_time_date.toLocaleTimeString('it-IT') })}>
                Confirm
            </Button>
        </View>

        {this.state.parkTimePickerShow && (
        <DateTimePicker
          value={this.state.park_time_date}
          mode={'time'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={(event, value) => {this.setState({ park_time_date: value }); if (Platform.OS === 'android') {this.setState({parkTimePickerShow: false})}}}
          style={styles.datePicker}
        />
        )}

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Leave Time</Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.datePickerValueField}
                editable={false}
                selectTextOnFocus={false}
                value={this.state.leave_time}
                onPressIn={()=>{this.setState({ leaveTimePickerShow: true })}}
            />
            <Button style={styles.datePickerButtonField} buttonColor={"#2F465B"} mode="contained" onPress={() => this.setState({ leaveTimePickerShow: false, leave_time: this.state.leave_time_date.toLocaleTimeString('it-IT') })}>
                Confirm
            </Button>
        </View>

        {this.state.leaveTimePickerShow && (
        <DateTimePicker
          value={this.state.leave_time_date}
          mode={'time'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={(event, value) => {this.setState({ leave_time_date: value }); if (Platform.OS === 'android') {this.setState({leaveTimePickerShow: false})}}}
          style={styles.datePicker}
        />
        )}

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vahicle Type: </Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={this.state.vehicle_type}
                onChangeText={text => this.setState({ vehicle_type: text })}
                placeholder='Toyota Vios'
            />
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Color</Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={this.state.vehicle_color}
                onChangeText={text => this.setState({ vehicle_color: text })}
                placeholder='White'
            />
        </View>
        
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Vehicle Number:</Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={this.state.vehicle_number}
                onChangeText={text => this.setState({ vehicle_number: text })}
                placeholder='e.g. QAA1234'
            />
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Remark:</Text>    
            <TextInput
                label={false}
                mode='outlined'
                style={styles.inputTextField}
                value={this.state.remark}
                onChangeText={text => this.setState({ remark: text })}                
            />
        </View>

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Guard name: </Text>    
            <TextInput
              label={false}
              mode='outlined'
              style={styles.inputTextField}
              value={global.currentGuardOnDuty}
              editable={false}
              required
            />
          </View>

        <View style={styles.buttonVerticalContainer}>
          <View style={styles.buttonHorizontalContainer}>
            <View style={styles.buttonContainer}>
              <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() => 
                this.props.navigation.goBack()}>
                BACK
              </Button>
            </View>
            <View style={styles.buttonContainer}>
              <Button style={styles.buttonText} buttonColor={"#2F465B"} mode="contained" onPress={() => 
                this.checkForm()}>
                SUBMIT
              </Button>
            </View>
          </View>
        </View>    
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}
  
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, 
    flexDirection: 'column', 
    justifyContent: 'space-between'
  },

  headerContainer:{
    justifyContent: 'center',
    backgroundColor: '#2F465B',
    height: 60,
    width
  },
  headerTitle:{
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 20, 
  },

  inputContainer:{
    marginTop: 30,
    alignSelf: 'center'
  },
  inputLabel: {
    fontSize: 14, 
    fontFamily: 'roboto-regular', 
    fontWeight: 'bold'
  },
  inputTextField:{
    width: width * 0.8, 
    height: 40, 
    backgroundColor: 'white'
  },
  datePickerValueField:{
    width: width * 0.8, 
    height: 40, 
    backgroundColor: 'white'
  },
  datePickerButtonField:{
    justifyContent: 'center'
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
  
  buttonVerticalContainer:{
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
  buttonContainer:{
    marginVertical: 15,
    marginHorizontal: 15, 
    justifyContent: 'flex-end'
  },
  buttonText: {
    justifyContent: 'center'
  }
});
