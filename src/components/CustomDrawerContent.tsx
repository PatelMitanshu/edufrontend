import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [teacherEmail, setTeacherEmail] = useState('teacher@edulearn.com');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    loadTeacherData();
    
    // Refresh profile data every time the drawer renders
    const interval = setInterval(loadTeacherData, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadTeacherData = async () => {
    try {
      const teacherData = await AsyncStorage.getItem('teacherData');
      if (teacherData) {
        const teacher = JSON.parse(teacherData);
        setTeacherName(teacher.name || 'Teacher');
        setTeacherEmail(teacher.email || 'teacher@edulearn.com');
        setProfilePicture(teacher.profilePicture || null);
      }
    } catch (error) {
      // Error loading teacher data, keep default values
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('teacherData');
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              // Logout error, continue anyway
            }
          },
        },
      ]
    );
  };

  const navigateToScreen = (screenName: string) => {
    props.navigation.navigate(screenName as never);
    props.navigation.closeDrawer();
    // Refresh profile data when navigating to Profile screen
    if (screenName === 'Profile') {
      setTimeout(loadTeacherData, 500); // Refresh after navigation
    }
  };

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <DrawerContentScrollView {...props} style={tw['flex-1']} contentContainerStyle={[tw['flex-1']]}>
        {/* Enhanced Profile Section with Gradient Background */}
        <View style={[tw['relative'], tw['p-6'], tw['bg-gradient-primary'], tw['shadow-lg'], { paddingTop: 48, paddingBottom: 32 }]}>
          {/* Background Pattern */}
          <View style={[tw['absolute'], { top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }]}>
            <View style={[tw['rounded-full'], tw['bg-white'], tw['absolute'], { width: 128, height: 128, top: -64, right: -64 }]} />
            <View style={[tw['rounded-full'], tw['bg-white'], tw['absolute'], { width: 96, height: 96, top: 32, left: -48 }]} />
          </View>
          
          <View style={[tw['flex-row'], tw['items-center'], { zIndex: 10 }]}>
            {profilePicture ? (
              <View style={[tw['relative']]}>
                <Image
                  source={{ uri: profilePicture }}
                  style={[tw['w-20'], tw['h-20'], tw['rounded-full'], tw['mr-4']]}
                  resizeMode="cover"
                />
      
              </View>
            ) : (
              <View style={[tw['relative']]}>
                <View style={[tw['w-20'], tw['h-20'], tw['rounded-full'], tw['bg-white'], tw['justify-center'], tw['items-center'], tw['mr-4'], tw['shadow-lg'], { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[tw['text-4xl']]}>👨‍🏫</Text>
                </View>
               
              </View>
            )}
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-xl'], tw['font-bold'], tw['text-white'], tw['mb-1']]} numberOfLines={1} ellipsizeMode="tail">
                {teacherName}
              </Text>
              <Text style={[tw['text-sm'], tw['text-white'], { opacity: 0.8 }]} numberOfLines={1} ellipsizeMode="tail">
                {teacherEmail}
              </Text>
             
            </View>
          </View>
        </View>

        {/* Enhanced Menu Items */}
        <View style={[tw['py-4'], { paddingBottom: 24 }]}>
          {/* Profile Menu Item */}
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['mx-4'], tw['px-4'], tw['py-4'], tw['bg-surface'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-3']]}
            onPress={() => navigateToScreen('Profile')}
          >
            <View style={[tw['w-10'], tw['h-10'], tw['justify-center'], tw['items-center'], tw['mr-4'], tw['bg-gradient-primary'], tw['rounded-xl'], tw['shadow-sm']]}> 
              <Text style={[tw['text-lg'], tw['text-white']]}>👤</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-base'], tw['text-primary'], tw['font-bold']]}>Profile</Text>
              <Text style={[tw['text-sm'], tw['text-secondary']]}>Manage your account</Text>
            </View>
            <View style={[tw['w-6'], tw['h-6'], tw['justify-center'], tw['items-center']]}>
              <Text style={[tw['text-secondary'], tw['text-sm']]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Home Menu Item */}
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['mx-4'], tw['px-4'], tw['py-4'], tw['bg-surface'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-3']]}
            onPress={() => navigateToScreen('Home')}
          >
            <View style={[tw['w-10'], tw['h-10'], tw['justify-center'], tw['items-center'], tw['mr-4'], tw['bg-gradient-primary'], tw['rounded-xl'], tw['shadow-sm']]}> 
              <Text style={[tw['text-lg'], tw['text-white']]}>🏠</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-base'], tw['text-primary'], tw['font-bold']]}>Home</Text>
              <Text style={[tw['text-sm'], tw['text-secondary']]}>Dashboard & overview</Text>
            </View>
            <View style={[tw['w-6'], tw['h-6'], tw['justify-center'], tw['items-center']]}>
              <Text style={[tw['text-secondary'], tw['text-sm']]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Settings Menu Item */}
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['mx-4'], tw['px-4'], tw['py-4'], tw['bg-surface'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-3']]}
            onPress={() => navigateToScreen('Settings')}
          >
            <View style={[tw['w-10'], tw['h-10'], tw['justify-center'], tw['items-center'], tw['mr-4'], tw['bg-gradient-primary'], tw['rounded-xl'], tw['shadow-sm']]}> 
              <Text style={[tw['text-lg'], tw['text-white']]}>⚙️</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-base'], tw['text-primary'], tw['font-bold']]}>Settings</Text>
              <Text style={[tw['text-sm'], tw['text-secondary']]}>App preferences</Text>
            </View>
            <View style={[tw['w-6'], tw['h-6'], tw['justify-center'], tw['items-center']]}>
              <Text style={[tw['text-secondary'], tw['text-sm']]}>›</Text>
            </View>
          </TouchableOpacity>

          {/* About Menu Item */}
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['mx-4'], tw['px-4'], tw['py-4'], tw['bg-surface'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-3']]}
            onPress={() => navigateToScreen('About')}
          >
            <View style={[tw['w-10'], tw['h-10'], tw['justify-center'], tw['items-center'], tw['mr-4'], tw['bg-gradient-primary'], tw['rounded-xl'], tw['shadow-sm']]}> 
              <Text style={[tw['text-lg'], tw['text-white']]}>ℹ️</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-base'], tw['text-primary'], tw['font-bold']]}>About</Text>
              <Text style={[tw['text-sm'], tw['text-secondary']]}>App information</Text>
            </View>
            <View style={[tw['w-6'], tw['h-6'], tw['justify-center'], tw['items-center']]}>
              <Text style={[tw['text-secondary'], tw['text-sm']]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Spacer to push logout to bottom */}
        <View style={tw['flex-1']} />

        {/* Enhanced Logout Section */}
        <View style={[tw['px-4'], { paddingTop: 16 }, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['bg-error'], tw['px-5'], tw['py-4'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-3']]}
            onPress={handleLogout}
          >
            <View style={[tw['w-10'], tw['h-10'], tw['justify-center'], tw['items-center'], tw['mr-4'], { backgroundColor: 'rgba(255,255,255,0.2)' }, tw['rounded-xl']]}> 
              <Text style={[tw['text-lg'], tw['text-white']]}>🚪</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-base'], tw['text-white'], tw['font-bold']]}>Logout</Text>
              <Text style={[tw['text-sm'], tw['text-white'], { opacity: 0.8 }]}>Sign out of your account</Text>
            </View>
            <View style={[tw['w-6'], tw['h-6'], tw['justify-center'], tw['items-center']]}>
              <Text style={[tw['text-white'], tw['text-sm']]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Enhanced Footer */}
        <View style={[tw['px-5'], tw['py-4'], tw['items-center'], tw['border-t'], tw['border-surface'], { backgroundColor: theme.colors.background }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['mb-2']]}>
            <View style={[tw['w-8'], tw['h-8'], tw['bg-gradient-primary'], tw['rounded-lg'], tw['justify-center'], tw['items-center'], tw['mr-2']]}> 
              <Text style={[tw['text-sm'], tw['text-white']]}>📚</Text>
            </View>
            <Text style={[tw['text-sm'], tw['text-primary'], tw['font-bold']]}>EduLearn v1.0</Text>
          </View>
          <Text style={[tw['text-xs'], tw['text-secondary'], tw['text-center']]}>Education Management System</Text>
          <View style={[tw['flex-row'], tw['items-center'], tw['mt-2']]}>
            <View style={[tw['w-2'], tw['h-2'], tw['bg-primary'], tw['rounded-full'], tw['mr-2']]} />
            <Text style={[tw['text-xs'], tw['text-secondary']]}>Made with ❤️ for Teachers</Text>
          </View>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default CustomDrawerContent;