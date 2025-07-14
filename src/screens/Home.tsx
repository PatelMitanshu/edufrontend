import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { DrawerParamList, RootStackParamList } from '../App';
import { standardService, Standard } from '../services/standardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const { width } = Dimensions.get('window');

function Home({ navigation }: Props) {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    loadTeacherData();
    loadStandards();
  }, []);

  // Add focus listener to refresh profile data
  useFocusEffect(
    React.useCallback(() => {
      loadTeacherData();
    }, [])
  );

  const loadTeacherData = async () => {
    try {
      const teacherData = await AsyncStorage.getItem('teacherData');
      if (teacherData) {
        const teacher = JSON.parse(teacherData);
        setTeacherName(teacher.name);
        setProfilePicture(teacher.profilePicture || null);
      }
    } catch (error) {
      // Error loading teacher data, keep defaults
    }
  };

  const loadStandards = async () => {
    try {
      setLoading(true);
      const response = await standardService.getStandards();
      setStandards(response.standards);
    } catch (error) {
      Alert.alert('Error', 'Failed to load standards. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeacherData(); // Refresh profile data
    loadStandards();
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
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('teacherData');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const renderStandardCard = ({ item }: { item: Standard }) => (
    <TouchableOpacity
      style={[tw['bg-surface'], tw['rounded-3xl'], tw['mb-4'], tw['shadow-xl'], tw['flex-row'], tw['items-center'], tw['overflow-hidden'], tw['border'], tw['border-surface']]}
      onPress={() => navigation.navigate('StandardDetail', { 
        standardId: item._id, 
        standardName: item.name 
      })}
      activeOpacity={0.7}
    >
      {/* Colorful Left Border */}
      <View style={[tw['w-2'], tw['h-full'], tw['bg-gradient-blue']]} />
      
      <View style={[tw['flex-1'], tw['p-5']]}>
        <View style={[tw['flex-row'], tw['items-center'], tw['mb-3']]}>
          <View style={[tw['w-12'], tw['h-12'], tw['bg-primary-light'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3']]}>
            <Text style={[tw['text-2xl']]}>📚</Text>
          </View>
          <View style={tw['flex-1']}>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['mb-1']]}>
              {item.name}
            </Text>
            <Text style={[tw['text-sm'], tw['text-primary'], tw['font-medium'], tw['uppercase'], tw['tracking-wide']]}>
              Standard
            </Text>
          </View>
        </View>
        
        
        
        <View style={[tw['flex-row'], tw['flex-wrap'], tw['items-center']]}>
          {item.subjects.slice(0, 3).map((subject, index) => (
            <View key={index} style={[tw['bg-gradient-blue'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mr-2'], tw['mb-1'], tw['shadow-xs']]}>
              <Text style={[tw['text-xs'], tw['text-white'], tw['font-medium'], tw['tracking-wide']]}>
                {subject}
              </Text>
            </View>
          ))}
          {item.subjects.length > 3 && (
            <View style={[tw['bg-primary-light'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mb-1']]}>
              <Text style={[tw['text-xs'], tw['text-primary'], tw['font-medium']]}>
                +{item.subjects.length - 3} more
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Enhanced Arrow */}
      <View style={[tw['px-5'], tw['items-center']]}>
        <View style={[tw['w-10'], tw['h-10'], tw['bg-primary'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['shadow-colored-blue']]}>
          <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold']]}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <Text style={[tw['text-base'], tw['text-secondary']]}>Loading standards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      {/* Enhanced Header */}
      <View style={[tw['bg-surface'], tw['px-5'], tw['py-6'], tw['shadow-lg'], tw['border-b'], tw['border-surface']]}>
        <View style={[tw['flex-row'], tw['justify-between'], tw['items-center']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={[tw['w-12'], tw['h-12'], tw['rounded-full'], tw['mr-3'], tw['shadow-colored-blue']]}
                resizeMode="cover"
              />
            ) : (
              <View style={[tw['w-12'], tw['h-12'], tw['bg-gradient-blue'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3'], tw['shadow-colored-blue']]}>
                <Text style={[tw['text-xl'], tw['text-white']]}>📚</Text>
              </View>
            )}
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-xl'], tw['font-extrabold'], tw['text-primary'], tw['tracking-wide']]}>
                EduLearn
              </Text>
              <Text style={[tw['text-sm'], tw['text-secondary'], tw['font-medium']]}>
                Welcome back, {teacherName}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[tw['bg-gradient-primary'], tw['px-4'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['shadow-colored-blue']]}
            onPress={openDrawer}
          >
            <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold']]}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Title Section */}
      <View style={[tw['px-5'], tw['py-6'], tw['bg-surface'], tw['mb-2']]}>
        <Text style={[tw['text-3xl'], tw['font-extrabold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide']]}>
          Select a Standard
        </Text>
        <Text style={[tw['text-base'], tw['text-secondary'], tw['leading-relaxed'], tw['font-light']]}>
          Choose a standard to manage students and their work
        </Text>
      </View>

      {/* Standards List */}
      <FlatList
        data={standards}
        renderItem={renderStandardCard}
        keyExtractor={(item) => item._id}
        style={[tw['px-5']]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[tw['items-center'], tw['py-10']]}>
            <Text style={[tw['text-lg'], tw['font-semibold'], tw['text-secondary'], tw['mb-2']]}>
              No standards available
            </Text>
            <Text style={[tw['text-sm'], tw['text-muted'], tw['text-center']]}>
              Contact your administrator to add standards
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default Home;