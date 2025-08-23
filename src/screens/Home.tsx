import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';
import { standardService, Standard } from '../services/standardService';
import { authService } from '../services/authService';
import { lessonPlanService, LessonPlan } from '../services/lessonPlanService';
import LessonPlanCard from '../components/LessonPlanCard';
import AddLessonPlan from './AddLessonPlan';

interface HomeProps {
  navigation: any;
}

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  
  // Section state
  const [activeSection, setActiveSection] = useState<'student' | 'teacher'>('student');
  
  // Lesson plan state
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [showAddLessonPlan, setShowAddLessonPlan] = useState(false);
  const [editingLessonPlan, setEditingLessonPlan] = useState<LessonPlan | null>(null);

  useEffect(() => {
    loadTeacherData();
    loadStandards();
    loadLessonPlans();
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

  const refreshProfileFromServer = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await authService.getProfile();
        // Update AsyncStorage with fresh data
        await AsyncStorage.setItem('teacherData', JSON.stringify(response.teacher));
        // Update UI
        setTeacherName(response.teacher.name);
        setProfilePicture(response.teacher.profilePicture || null);
      }
    } catch (error) {
      // Silently fail - use cached data
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

  const loadLessonPlans = async () => {
    try {
      const plans = await lessonPlanService.getLessonPlans();
      setLessonPlans(plans);
    } catch (error) {Alert.alert('Error', 'Failed to load lesson plans. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeacherData(); // Refresh profile data
    loadStandards();
    if (activeSection === 'teacher') {
      loadLessonPlans();
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

  const handleStandardLongPress = (standard: Standard) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Standard'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: `Delete "${standard.name}"?`,
          message: 'This action cannot be undone. All divisions and students in this standard will also be deleted.',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            confirmDeleteStandard(standard);
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        'Delete Standard',
        `Are you sure you want to delete "${standard.name}"?\n\nThis action cannot be undone. All divisions and students in this standard will also be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteStandard(standard) }
        ]
      );
    }
  };

  const confirmDeleteStandard = async (standard: Standard) => {
    try {
      await standardService.deleteStandard(standard._id);
      setStandards(standards.filter(s => s._id !== standard._id));
      Alert.alert('Success', `"${standard.name}" has been deleted successfully.`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete standard. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  // Lesson Plan Functions
  const handleSaveLessonPlan = async (lessonPlanData: Omit<LessonPlan, 'id' | '_id'>) => {
    try {
      if (editingLessonPlan) {
        // Update existing plan
        const updatedPlan = await lessonPlanService.updateLessonPlan(
          editingLessonPlan.id || editingLessonPlan._id || '', 
          lessonPlanData
        );
        const updatedPlans = lessonPlans.map(plan =>
          (plan.id === editingLessonPlan.id || plan._id === editingLessonPlan._id)
            ? updatedPlan
            : plan
        );
        setLessonPlans(updatedPlans);
        setEditingLessonPlan(null);
      } else {
        // Add new plan
        const newPlan = await lessonPlanService.createLessonPlan(lessonPlanData);
        setLessonPlans([...lessonPlans, newPlan]);
      }
    } catch (error) {Alert.alert('Error', 'Failed to save lesson plan. Please try again.');
    }
  };

  const handleEditLessonPlan = (plan: LessonPlan) => {
    setEditingLessonPlan(plan);
    setShowAddLessonPlan(true);
  };

  const handleDeleteLessonPlan = async (id: string) => {
    Alert.alert(
      'Delete Lesson Plan',
      'Are you sure you want to delete this lesson plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await lessonPlanService.deleteLessonPlan(id);
              const updatedPlans = lessonPlans.filter(plan => 
                plan.id !== id && plan._id !== id
              );
              setLessonPlans(updatedPlans);
            } catch (error) {Alert.alert('Error', 'Failed to delete lesson plan. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const result = await lessonPlanService.toggleLessonPlanCompletion(id);
      const updatedPlans = lessonPlans.map(plan =>
        (plan.id === id || plan._id === id) 
          ? { ...plan, completed: result.completed, completedAt: result.completedAt } 
          : plan
      );
      setLessonPlans(updatedPlans);
    } catch (error) {Alert.alert('Error', 'Failed to update lesson plan. Please try again.');
    }
  };

  const renderStandardCard = ({ item }: { item: Standard }) => (
    <TouchableOpacity
      style={[tw['bg-white'], tw['rounded-xl'], tw['mb-4'], tw['shadow-lg'], tw['flex-row'], tw['items-center'], tw['overflow-hidden'], tw['border'], tw['border-gray-200']]}
      onPress={() => navigation.navigate('StandardDetail', { 
        standardId: item._id, 
        standardName: item.name 
      })}
      onLongPress={() => handleStandardLongPress(item)}
      activeOpacity={0.7}
    >
      {/* Colorful Left Border */}
      <View style={[tw['w-2'], tw['h-full'], tw['bg-blue-500']]} />
      
      <View style={[tw['flex-1'], tw['p-5']]}>
        <View style={[tw['flex-row'], tw['items-center'], tw['mb-3']]}>
          <View style={[tw['w-12'], tw['h-12'], tw['bg-blue-100'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3']]}>
            <Text style={[tw['text-2xl']]}>📚</Text>
          </View>
          <View style={tw['flex-1']}>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['text-gray-800'], tw['mb-1']]}>
              {item.name}
            </Text>
            <Text style={[tw['text-sm'], tw['text-gray-600'], tw['font-medium'], tw['uppercase'], tw['tracking-wide']]}>
              Standard
            </Text>
          </View>
        </View>
        
        <View style={[tw['flex-row'], tw['flex-wrap'], tw['items-center']]}>
          {item.subjects.slice(0, 3).map((subject, index) => (
            <View key={index} style={[tw['bg-blue-500'], tw['px-3'], tw['py-1'], tw['rounded-full'], tw['mr-2'], tw['mb-1'], tw['shadow-sm']]}>
              <Text style={[tw['text-xs'], tw['text-white'], tw['font-medium'], tw['tracking-wide']]}>
                {subject}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Enhanced Arrow */}
      <View style={[tw['px-5'], tw['items-center']]}>
        <View style={[tw['w-10'], tw['h-10'], tw['bg-blue-600'], tw['rounded-full'], tw['items-center'], tw['justify-center']]}>
          <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['mb-1']]}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStudentSection = () => (
    <View style={[tw['flex-1']]}>
      {/* Student Section Title */}
      <View style={[tw['px-5'], tw['py-6'], tw['bg-white'], tw['mb-2']]}>
        <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['mb-4']]}>
          <View style={[tw['flex-row'], tw['items-center']]}>
            <Text style={[tw['text-xl'], tw['font-extrabold'], tw['text-gray-800'], tw['mb-2'], tw['tracking-wide']]}>
              Select a Standard
            </Text>
          </View>
          <TouchableOpacity
            style={[
              tw['bg-blue-600'],
              tw['px-4'],
              tw['py-3'],
              tw['rounded-xl'],
              tw['items-center'],
              tw['shadow-lg'],
              { marginLeft: 16 }
            ]}
            onPress={() => navigation.navigate('AddStandard')}
            activeOpacity={0.7}
          >
            <Text style={[tw['text-base'], tw['font-bold'], tw['text-white']]}>
              ➕ Add Standard
            </Text>
          </TouchableOpacity>
        </View>
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
            <Text style={[tw['text-4xl'], tw['mb-4']]}>📚</Text>
            <Text style={[tw['text-lg'], tw['font-semibold'], tw['text-gray-600'], tw['mb-2']]}>
              No standards available
            </Text>
            <Text style={[tw['text-sm'], tw['text-gray-500'], tw['text-center'], tw['mb-6']]}>
              Create your first standard to start managing students
            </Text>
            <TouchableOpacity
              style={[
                tw['bg-blue-600'],
                tw['px-6'],
                tw['py-3'],
                tw['rounded-xl'],
                tw['items-center']
              ]}
              onPress={() => navigation.navigate('AddStandard')}
              activeOpacity={0.7}
            >
              <Text style={[tw['text-base'], tw['font-bold'], tw['text-white']]}>
                ➕ Create First Standard
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );

  const renderTeacherSection = () => (
    <View style={[tw['flex-1']]}>
      {/* Teacher Section Title */}
      <View style={[tw['px-5'], tw['py-6'], tw['bg-white'], tw['mb-2']]}>
        <View style={[tw['mb-4']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['justify-between']]}>
            <View style={[tw['flex-1'], tw['mr-3']]}> 
              {/* Keep title constrained so long text doesn't push the Add button off-screen */}
              <Text
                numberOfLines={1}
                ellipsizeMode={'tail'}
                style={[tw['text-xl'], tw['font-extrabold'], tw['text-gray-800'], tw['tracking-wide']]}
              >
                Lesson Plans
              </Text>
            </View>
            <TouchableOpacity
              style={[
                tw['bg-green-500'],
                tw['px-4'],
                tw['py-3'],
                tw['rounded-xl'],
                tw['items-center'],
                tw['shadow-lg'],
                { minWidth: 72 }, // reserve space for the button so it can't be pushed out
              ]}
              onPress={() => setShowAddLessonPlan(true)}
              activeOpacity={0.7}
            >
              <Text style={[tw['text-sm'], tw['font-bold'], tw['text-white']]}>
                ➕ Add
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Lesson Plans List */}
      <ScrollView
        style={[tw['px-5']]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {lessonPlans.length > 0 ? (
          lessonPlans.map((plan) => (
            <LessonPlanCard
              key={plan.id || plan._id}
              lessonPlan={plan}
              onEdit={handleEditLessonPlan}
              onDelete={handleDeleteLessonPlan}
              onToggleComplete={handleToggleComplete}
            />
          ))
        ) : (
          <View style={[tw['items-center'], tw['py-10']]}>
            <Text style={[tw['text-4xl'], tw['mb-4']]}>📋</Text>
            <Text style={[tw['text-lg'], tw['font-semibold'], tw['text-gray-600'], tw['mb-2']]}>
              No lesson plans yet
            </Text>
            <Text style={[tw['text-sm'], tw['text-gray-500'], tw['text-center'], tw['mb-6']]}>
              Create your first lesson plan to organize your teaching
            </Text>
            <TouchableOpacity
              style={[
                tw['bg-green-500'],
                tw['px-6'],
                tw['py-3'],
                tw['rounded-xl'],
                tw['items-center']
              ]}
              onPress={() => setShowAddLessonPlan(true)}
              activeOpacity={0.7}
            >
              <Text style={[tw['text-base'], tw['font-bold'], tw['text-white']]}>
                ➕ Create First Lesson Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <Text style={[tw['text-base'], tw['text-gray-600']]}>Loading...</Text>
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
      <View style={[tw['bg-white'], tw['px-5'], tw['py-6'], tw['shadow-lg'], tw['border-b'], tw['border-gray-200']]}>
        <View style={[tw['flex-row'], tw['justify-between'], tw['items-center']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={[tw['w-12'], tw['h-12'], tw['rounded-full'], tw['mr-3'], tw['shadow-lg']]}
                resizeMode="cover"
              />
            ) : (
              <View style={[tw['w-12'], tw['h-12'], tw['bg-blue-500'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3'], tw['shadow-lg']]}>
                <Text style={[tw['text-xl'], tw['text-white']]}>📚</Text>
              </View>
            )}
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-xl'], tw['font-extrabold'], tw['text-gray-800'], tw['tracking-wide']]}>
                EduLearn
              </Text>
              <Text style={[tw['text-sm'], tw['text-gray-600'], tw['font-medium']]}>
                Welcome back, {teacherName}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[tw['bg-blue-600'], tw['px-4'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['shadow-lg']]}
            onPress={openDrawer}
          >
            <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold']]}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Tabs */}
      <View style={[tw['bg-white'], tw['px-5'], tw['py-4'], tw['border-b'], tw['border-gray-200']]}>
        <View style={[tw['flex-row'], tw['bg-gray-100'], tw['rounded-xl'], tw['p-1']]}>
          <TouchableOpacity
            style={[
              tw['flex-1'],
              tw['py-3'],
              tw['rounded-xl'],
              tw['items-center'],
              activeSection === 'student' ? tw['bg-blue-600'] : { backgroundColor: 'transparent' },
            ]}
            onPress={() => setActiveSection('student')}
          >
            <Text
              style={[
                tw['text-base'],
                tw['font-semibold'],
                activeSection === 'student' ? tw['text-white'] : tw['text-gray-600'],
              ]}
            >
              👨‍🎓 Students
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              tw['flex-1'],
              tw['py-3'],
              tw['rounded-xl'],
              tw['items-center'],
              activeSection === 'teacher' ? tw['bg-green-500'] : { backgroundColor: 'transparent' },
            ]}
            onPress={() => setActiveSection('teacher')}
          >
            <Text
              style={[
                tw['text-base'],
                tw['font-semibold'],
                activeSection === 'teacher' ? tw['text-white'] : tw['text-gray-600'],
              ]}
            >
              👨‍🏫 Teacher
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content based on active section */}
      {activeSection === 'student' ? renderStudentSection() : renderTeacherSection()}

      {/* Add Lesson Plan Modal */}
      <AddLessonPlan
        visible={showAddLessonPlan}
        onClose={() => {
          setShowAddLessonPlan(false);
          setEditingLessonPlan(null);
        }}
        onSave={handleSaveLessonPlan}
        editingPlan={editingLessonPlan}
      />
    </SafeAreaView>
  );
}

export default Home;