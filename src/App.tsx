
import { StatusBar, useColorScheme, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from './contexts/ThemeContext';

export type RootStackParamList = {
  Dashboard: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  StandardDetail: { standardId: string; standardName: string };
  StudentProfile: { studentId: string };
  AddStudent: { standardId: string };
  AddUpload: { studentId: string };
};

export type DrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};
import Home from './screens/Home';
import Login from './screens/Login';
import Register from './screens/Register';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import About from './screens/About';
import StandardDetail from './screens/StandardDetail';
import StudentProfile from './screens/StudentProfile';
import AddStudent from './screens/AddStudent';
import AddUpload from './screens/AddUpload';
import SplashScreen from './components/SplashScreen';
import LoadingScreen from './components/LoadingScreen';
import CustomDrawerContent from './components/CustomDrawerContent';
import { SafeAreaView } from 'react-native-safe-area-context';


const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// Drawer Navigator for authenticated screens
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 340,
          backgroundColor: '#ffffff',
        },
        drawerType: 'front',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="Settings" component={Settings} />
      <Drawer.Screen name="About" component={About} />
    </Drawer.Navigator>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');

  useEffect(() => {
    // Initialize app and check for existing auth token
    const initializeApp = async () => {
      try {
        // Simulate app initialization time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for existing auth token
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setInitialRoute('Dashboard');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        // Error during app initialization - use defaults
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen message="Initializing EduLearn..." />;
  }

  return (
    <ThemeProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
            <Stack.Screen 
              name="Dashboard" 
              component={DrawerNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            <Stack.Screen 
              name="StandardDetail" 
              component={StandardDetail} 
              options={{ 
                headerShown: true,
                title: 'Standard Details',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="StudentProfile" 
              component={StudentProfile} 
              options={{ 
                headerShown: true,
                title: 'Student Profile',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="AddStudent" 
              component={AddStudent} 
              options={{ 
                headerShown: true,
                title: 'Add Student',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="AddUpload" 
              component={AddUpload} 
              options={{ 
                headerShown: true,
                title: 'Add Upload',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </ThemeProvider>
  );
}

export default App;
