
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  StandardDetail: { standardId: string; standardName: string };
  StudentProfile: { studentId: string };
  AddStudent: { standardId: string };
  AddUpload: { studentId: string };
};
import Home from './screens/Home';
import Login from './screens/Login';
import Register from './screens/Register';
import StandardDetail from './screens/StandardDetail';
import StudentProfile from './screens/StudentProfile';
import AddStudent from './screens/AddStudent';
import AddUpload from './screens/AddUpload';
import { SafeAreaView } from 'react-native-safe-area-context';


const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen 
            name="StandardDetail" 
            component={StandardDetail} 
            options={{ 
              headerShown: true,
              title: 'Standard Details'
            }} 
          />
          <Stack.Screen 
            name="StudentProfile" 
            component={StudentProfile} 
            options={{ 
              headerShown: true,
              title: 'Student Profile'
            }} 
          />
          <Stack.Screen 
            name="AddStudent" 
            component={AddStudent} 
            options={{ 
              headerShown: true,
              title: 'Add Student'
            }} 
          />
          <Stack.Screen 
            name="AddUpload" 
            component={AddUpload} 
            options={{ 
              headerShown: true,
              title: 'Add Upload'
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  logo: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',   
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
  },
  successText: {
    color: 'green',
    fontSize: 14,
    marginTop: 10,
  },
});

export default App;
