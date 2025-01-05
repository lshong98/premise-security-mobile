import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Platform, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { SimpleLineIcons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SignInSelect from '../screens/signin/SignInSelect';
import SignInCompanyScreen from '../screens/signin/SignInCompanyScreen';
import SignInPersonScreen from '../screens/signin/SignInPersonScreen';
import OtherCompanyScreen from '../screens/signin/OtherCompanyScreen';
import OtherPersonScreen from '../screens/signin/OtherPersonScreen';
import EntrySignInScreen from '../screens/signin/EntrySignInScreen';
import PictureSignInScreen from '../screens/signin/PictureSignInScreen';
import PictureSignOutScreen from '../screens/signout/PictureSignOutScreen';
import RollCallScreen from '../screens/rollcall/RollCallScreen';
import EZSignInScreen from '../screens/ez/EZSignInScreen';
import GuardHomeScreen from '../screens/guard/GuardHomeScreen';
import GuardPatrolScreen from '../screens/guard/GuardPatrolScreen';
import GuardActivityScreen from '../screens/guard/GuardActivityScreen';
import IncidentReportScreen from '../screens/guard/IncidentReportScreen';
import OutsiderVehicleRecordScreen from '../screens/outsidervehiclerecord/OutsiderVehicleRecordScreen';

const Stack = createStackNavigator();
function GuardStack() {
  return (
    <Stack.Navigator
      initialRouteName="GuardHome"
      screenOptions={{
        headerMode: 'none',
      }}
    >
      <Stack.Screen
        name="GuardHome"
        component={GuardHomeScreen}
      />
      <Stack.Screen
        name="OutsiderVehicleRecord"
        component={OutsiderVehicleRecordScreen}
      />
      <Stack.Screen
        name="GuardPatrol"
        component={GuardPatrolScreen}
      />
      <Stack.Screen
        name="GuardActivity"
        component={GuardActivityScreen}
      />
      <Stack.Screen
        name="IncidentReport"
        component={IncidentReportScreen}
      />
    </Stack.Navigator>
  );
}
function SignInStack() {
  return (
    <Stack.Navigator
      initialRouteName="SignInSelect"
      screenOptions={{
        headerMode: 'none',
      }}
    >
      <Stack.Screen
        name="SignInSelect"
        component={SignInSelect}
      />
      <Stack.Screen
        name="SignInCompany"
        component={SignInCompanyScreen}
      />
      <Stack.Screen
        name="OtherCompany"
        component={OtherCompanyScreen}
      />
      <Stack.Screen
        name="SignInPerson"
        component={SignInPersonScreen}
      />
      <Stack.Screen
        name="OtherPerson"
        component={OtherPersonScreen}
      />
      <Stack.Screen
        name="EntrySignIn"
        component={EntrySignInScreen}
      />
      <Stack.Screen
        name="PictureSignIn"
        component={PictureSignInScreen}
      />
    </Stack.Navigator>
  );
}

function SignOutStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerMode: 'none',
      }}
    >
      <Stack.Screen
        name="PictureSignOut"
        component={PictureSignOutScreen}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          headerTitle: 'Home',
          headerTitleStyle: {
            fontFamily: 'roboto-bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

const Tab = createMaterialTopTabNavigator();

function HomeStack(){
  const navigation = useNavigation();

  const resetStack = (routeName) => {
    navigation.reset({
      index: 0,
      routes: [{ name: routeName }],
    });
  };

  return(
    <SafeAreaView style={styles.container}>
    <Tab.Navigator
      initialRouteName="HomeSignOut"
      screenOptions={({route}) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeSignOut') {
            iconName = 'screen-desktop'
          }else if (route.name === 'SignIn') {
            iconName = 'people'
          }else if (route.name === 'EZSignIn') {
            iconName = 'rocket'
          }else if (route.name === 'RollCall') {
            iconName = 'fire'
          }else if (route.name === 'Guard') {
            iconName = 'shield'
          }

          // You can return any component that you like here!
          return <SimpleLineIcons name={iconName} size={24} />;
        },
        swipeEnabled: false,
        tabBarActiveTintColor: 'rgb(21, 31, 53)',
        tabBarInactiveTintColor : 'rgb(89, 102, 139)',
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 12,
        },
        tabBarStyle: { backgroundColor: '#FFF' },
        style: {
          fontWeight: 'bold',
          backgroundColor: '#FFF',
          marginTop: (Platform.OS === 'ios') ? 0 : StatusBar.currentHeight,
          borderBottomColor: '#f2e9e9',
          borderBottomWidth: 1,
        },
        tabBarIndicatorStyle: {
          borderBottomColor: 'rgb(21, 31, 53)',
          borderBottomWidth: 4,
        }
      })}
      sceneContainerStyle={{backgroundColor: '#FFF'}}
      >
    <Tab.Screen key="HomeSignOut" name="HomeSignOut" component={SignOutStack} options={{ tabBarLabel: 'Home'}} listeners={{tabPress: (e) => {resetStack("Home")}}}/>
    <Tab.Screen key="SignIn" name="SignIn" component={SignInStack} options={{ tabBarLabel: 'Sign in'}} listeners={{tabPress: (e) => {resetStack("SignInSelect")}}}/>
    <Tab.Screen key="EZSignIn" name="EZSignIn" component={EZSignInScreen} options={{ tabBarLabel: 'EZ Sign In'}} />
    <Tab.Screen key="RollCall" name="RollCall" component={RollCallScreen} options={{ tabBarLabel: 'Roll Call'}} />
    <Tab.Screen key="Guard" name="Guard" component={GuardStack} options={{ tabBarLabel: 'Guard'}} listeners={{tabPress: (e) => {resetStack("GuardHome")}}}/>
    </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function HomeNavigation(){
  return(
    HomeStack
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sceneStyle:{
    backgroundColor: '#fff',
  }
});

