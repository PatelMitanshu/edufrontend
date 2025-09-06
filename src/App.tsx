
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
  ForgotPassword: undefined;
  Profile: undefined;
  MCQTest: undefined;
  CreateMCQ: { standardId: string; standardName: string };
  MCQPreview: { mcqData: any; standardId: string; standardName: string; testId?: string };
  MCQTests: { studentId: string };
  StandardDetail: { standardId: string; standardName: string };
  AddDivision: { standardId: string; standardName: string };
  DivisionDetail: { 
    divisionId: string; 
    divisionName: string; 
    standardId: string; 
    standardName: string; 
  };
  EditDivision: { divisionId: string };
  StudentProfile: { studentId: string };
  AddStudent: { 
    standardId: string; 
    divisionId?: string; 
    divisionName?: string; 
  };
  AddUpload: { studentId: string };
  AddStandard: undefined;
  StudentImportPreview: {
    students: any[];
    divisionName: string;
    standardName: string;
  };
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
import ForgotPassword from './screens/ForgotPassword';
import Profile from './screens/Profile';
import Settings from './screens/Settings';
import About from './screens/About'
import MCQTest from './screens/MCQTest';
import CreateMCQ from './screens/CreateMCQ';
import MCQPreview from './screens/MCQPreview';
import MCQTestsScreen from './screens/MCQTestsScreen';
import StandardDetail from './screens/StandardDetail';
import AddDivision from './screens/AddDivision';
import DivisionDetail from './screens/DivisionDetail';
import EditDivision from './screens/EditDivision';
import StudentProfile from './screens/StudentProfile';
import AddStudent from './screens/AddStudent';
import AddUpload from './screens/AddUpload';
import AddStandard from './screens/AddStandard';
import StudentImportPreview from './screens/StudentImportPreview';
import SplashScreen from './components/SplashScreen';
import LoadingScreen from './components/LoadingScreen';
import CustomDrawerContent from './components/CustomDrawerContent';
import UpdateNotification from './components/UpdateNotification';
import { VersionCheckService, AppVersionInfo, UpdateHandlers } from './services/versionCheckService';
import { DownloadProgress } from './services/inAppDownloadService';
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
  
  // Update notification state
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [forceUpdateBlocking, setForceUpdateBlocking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        
        // Check for app updates after authentication check
        await checkForUpdates();
        
      } catch (error) {
        console.log('Error initializing app:', error);
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
        setShowSplash(false);
      }
    };

    initializeApp();
  }, []);
  
  // Check for app updates
  const checkForUpdates = async () => {
    try {
      const shouldCheck = await VersionCheckService.shouldCheckVersion();
      if (!shouldCheck) return;
      
      const versionInfo = await VersionCheckService.checkForUpdates();
      if (!versionInfo) return;
      
      const comparison = VersionCheckService.compareVersions(
        versionInfo.currentVersion,
        versionInfo.latestVersion
      );
      
      if (comparison < 0) {
        setUpdateInfo(versionInfo);
        setShowUpdateModal(true);
        
        // If force update is required, block the app
        if (versionInfo.forceUpdate) {
          setForceUpdateBlocking(true);
        }
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  };
  
  // Handle update action
  const handleUpdate = async () => {
    if (!updateInfo) return;
    
    const handlers: UpdateHandlers = {
      onDownloadStart: () => {
        console.log('📥 Download started');
        setIsDownloading(true);
        setDownloadProgress(null);
      },
      onProgress: (progress) => {
        console.log(`📊 Download progress: ${progress.percent}%`);
        setDownloadProgress(progress);
      },
      onDownloadComplete: () => {
        console.log('✅ Download completed');
        setIsDownloading(false);
        setIsUpdating(true);
      },
      onInstallStart: () => {
        console.log('📦 Installation started');
        setIsUpdating(true);
      },
      onError: (error) => {
        console.log('❌ Update error:', error);
        setIsDownloading(false);
        setIsUpdating(false);
        setDownloadProgress(null);
      }
    };

    try {
      const success = await VersionCheckService.handleUpdateWithDownload(
        updateInfo.downloadUrl || '',
        updateInfo.latestVersion,
        handlers
      );
      
      if (success) {
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.log('Error handling update:', error);
      handlers.onError?.('Update failed');
    }
  };
  
  // Handle skip update
  const handleSkipUpdate = async () => {
    if (!updateInfo) return;
    
    await VersionCheckService.skipVersion(updateInfo.latestVersion);
    setShowUpdateModal(false);
  };
  
  // Handle remind later
  const handleRemindLater = () => {
    setShowUpdateModal(false);
  };

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
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
            <Stack.Screen 
              name="Dashboard" 
              component={DrawerNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            <Stack.Screen name="MCQTest" component={MCQTest} options={{ headerShown: false }} />
            <Stack.Screen name="CreateMCQ" component={CreateMCQ} options={{ headerShown: false }} />
            <Stack.Screen name="MCQPreview" component={MCQPreview} options={{ headerShown: false }} />
            <Stack.Screen 
              name="MCQTests" 
              component={MCQTestsScreen} 
              options={{ headerShown: false }} 
            />
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
            <Stack.Screen 
              name="AddStandard" 
              component={AddStandard} 
              options={{ 
                headerShown: true,
                title: 'Add Standard',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="AddDivision" 
              component={AddDivision} 
              options={{ 
                headerShown: true,
                title: 'Add Division',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="DivisionDetail" 
              component={DivisionDetail} 
              options={{ 
                headerShown: true,
                title: 'Division Details',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="EditDivision" 
              component={EditDivision} 
              options={{ 
                headerShown: true,
                title: 'Edit Division',
                headerStyle: { backgroundColor: '#007BFF' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
              }} 
            />
            <Stack.Screen 
              name="StudentImportPreview" 
              component={StudentImportPreview} 
              options={{ 
                headerShown: false
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
        
        {/* Update Notification Modal */}
        {updateInfo && (
          <UpdateNotification
            visible={showUpdateModal}
            currentVersion={updateInfo.currentVersion}
            latestVersion={updateInfo.latestVersion}
            updateMessage={updateInfo.updateMessage || 'A new version is available!'}
            forceUpdate={updateInfo.forceUpdate}
            onUpdate={handleUpdate}
            onSkip={updateInfo.forceUpdate ? undefined : handleSkipUpdate}
            onRemindLater={updateInfo.forceUpdate ? undefined : handleRemindLater}
            isUpdating={isUpdating}
            downloadProgress={downloadProgress}
            isDownloading={isDownloading}
          />
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
}

export default App;
