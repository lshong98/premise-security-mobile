import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StatusBar, } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import LocationScreen from '../screens/auth/LocationScreen';

const headerStyle = {
  marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
};


const Stack = createStackNavigator();
function AuthStack() {
  return (
    <Stack.Navigator      
      screenOptions={{
        headerMode: 'none',
      }}
    >
      <Stack.Screen
        name="Location"
        component={LocationScreen}
        options={{ title: "Location", cardStyle: headerStyle}}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Login", cardStyle: headerStyle}}
      />
    </Stack.Navigator>
  );
}

export default function AuthNavigation(){
  return (
    AuthStack
  )
}