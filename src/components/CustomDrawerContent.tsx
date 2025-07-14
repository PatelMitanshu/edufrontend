import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
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

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      const teacherData = await AsyncStorage.getItem('teacherData');
      if (teacherData) {
        const teacher = JSON.parse(teacherData);
        setTeacherName(teacher.name || 'Teacher');
        setTeacherEmail(teacher.email || 'teacher@edulearn.com');
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
  };

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <DrawerContentScrollView {...props} style={tw['flex-1']} contentContainerStyle={[tw['flex-1']]}>
        {/* Profile Section */}
        <View style={[tw['flex-row'], tw['items-center'], tw['p-6'], tw['bg-surface'], tw['border-b'], tw['border-surface']]}>
          <View style={[tw['w-16'], tw['h-16'], tw['rounded-full'], tw['bg-primary'], tw['justify-center'], tw['items-center'], tw['mr-4']]}>
            <Text style={tw['text-3xl']}>👨‍🏫</Text>
          </View>
          <View style={[tw['flex-1'], tw['w-80']]}>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary']] } numberOfLines={1} ellipsizeMode="tail">
              {teacherName}
            </Text>
            <Text style={[tw['text-sm'], tw['text-secondary'], tw['mt-1']]} numberOfLines={1} ellipsizeMode="tail">
              {teacherEmail}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[tw['flex-1'], tw['py-4']]}>

          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-6'], tw['py-4'], tw['bg-surface'], tw['shadow-sm']]}
            onPress={() => navigateToScreen('Profile')}
          >
            <View style={[tw['w-8'], tw['h-8'], tw['justify-center'], tw['items-center'], tw['mr-4']]}>
              <Text style={[tw['text-xl']]}>👤</Text>
            </View>
            <Text style={[tw['text-base'], tw['text-primary'], tw['font-medium'], tw['flex-1']]}>Profile</Text>
          </TouchableOpacity>
        

          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-6'], tw['py-4'], tw['bg-surface'], tw['shadow-sm']]}
            onPress={() => navigateToScreen('Home')}
          >
            <View style={[tw['w-8'], tw['h-8'], tw['justify-center'], tw['items-center'], tw['mr-4']]}>
              <Text style={[tw['text-xl']]}>🏠</Text>
            </View>
            <Text style={[tw['text-base'], tw['text-primary'], tw['font-medium'], tw['flex-1']]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-6'], tw['py-4'], tw['bg-surface'], tw['shadow-sm']]}
            onPress={() => navigateToScreen('Settings')}
          >
            <View style={[tw['w-8'], tw['h-8'], tw['justify-center'], tw['items-center'], tw['mr-4']]}>
              <Text style={[tw['text-xl']]}>⚙️</Text>
            </View>
            <Text style={[tw['text-base'], tw['text-primary'], tw['font-medium'], tw['flex-1']]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-6'], tw['py-4'], tw['bg-surface'], tw['shadow-sm']]}
            onPress={() => navigateToScreen('About')}
          >
            <View style={[tw['w-8'], tw['h-8'], tw['justify-center'], tw['items-center'], tw['mr-4']]}>
              <Text style={[tw['text-xl']]}>ℹ️</Text>
            </View>
            <Text style={[tw['text-base'], tw['text-primary'], tw['font-medium'], tw['flex-1']]}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to push logout to bottom */}
        <View style={tw['flex-1']} />

      

        {/* Logout Section - Fixed at Bottom */}
        <View style={[tw['px-5'], tw['py-3'], { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['bg-error'], tw['px-5'], tw['py-4'], tw['rounded-xl'], tw['shadow-lg'], tw['mb-1']]}
            onPress={handleLogout}
          >
            <Text style={[tw['text-xl'], tw['mr-4'], tw['w-6']]}>🚪</Text>
            <Text style={[tw['text-base'], tw['text-white'], tw['font-bold']]}>Logout</Text>
          </TouchableOpacity>
        </View>
          {/* Footer */}
        <View style={[tw['p-5'], tw['items-center'], tw['border-t'], tw['border-surface']]}>
          <Text style={[tw['text-sm'], tw['text-primary'], tw['font-bold']]}>EduLearn v1.0</Text>
          <Text style={[tw['text-xs'], tw['text-secondary']]}>Education Management System</Text>
        </View>
      </DrawerContentScrollView>
    </SafeAreaView>
  );
}

export default CustomDrawerContent;
