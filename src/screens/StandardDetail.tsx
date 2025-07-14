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
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { studentService, Student } from '../services/studentService';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { tw } from '../utils/tailwind';

type Props = NativeStackScreenProps<RootStackParamList, 'StandardDetail'>;

function StandardDetail({ route, navigation }: Props) {
  const { standardId, standardName } = route.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const themedStyles = useThemedStyles(theme.colors);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentsByStandard(standardId);
      setStudents(response.students);
    } catch (error) {
      Alert.alert('Error', 'Failed to load students. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const handleAddStudent = () => {
    navigation.navigate('AddStudent', { standardId });
  };

  const handleStudentPress = (student: Student) => {
    navigation.navigate('StudentProfile', { studentId: student._id });
  };

  const renderStudentCard = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={[
        tw['flex-row'], 
        tw['items-center'], 
        tw['p-4'], 
        tw['mb-3'], 
        tw['rounded-xl'],
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={() => handleStudentPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        tw['w-12'], 
        tw['h-12'], 
        tw['rounded-full'], 
        tw['items-center'], 
        tw['justify-center'], 
        tw['mr-4'],
        { backgroundColor: theme.colors.primary }
      ]}>
        <Text style={[tw['text-base'], tw['font-bold'], { color: theme.colors.surface }]}>
          {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </Text>
      </View>
      <View style={[tw['flex-1']]}>
        <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>{item.name}</Text>
        {item.rollNumber && (
          <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Roll No: {item.rollNumber}</Text>
        )}
        {item.parentContact?.phone && (
          <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>📞 {item.parentContact.phone}</Text>
        )}
      </View>
      <View style={[tw['w-6'], tw['items-center']]}>
        <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[tw['text-lg'], tw['mt-4'], { color: theme.colors.text }]}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={[tw['p-6'], { backgroundColor: theme.colors.surface, paddingBottom: 16 }]}>
        <Text style={[tw['text-2xl'], tw['font-bold'], tw['mb-2'], { color: theme.colors.text }]}>{standardName}</Text>
        <Text style={[tw['text-base'], { color: theme.colors.textSecondary }]}>{students.length} Students</Text>
      </View>

      {/* Add Student Button */}
      <View style={[tw['px-6'], tw['py-4']]}>
        <TouchableOpacity 
          style={[tw['py-3'], tw['px-6'], tw['rounded-xl'], tw['items-center'], { backgroundColor: theme.colors.primary }]} 
          onPress={handleAddStudent}
        >
          <Text style={[tw['text-base'], tw['font-semibold'] , { color: theme.colors.surface }]}>+ Add Student</Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderStudentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[tw['px-6']]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[tw['items-center'], tw['py-10']]}>
            <Text style={[tw['text-4xl'], tw['mb-4']]}>👥</Text>
            <Text style={[tw['text-lg'], tw['font-bold'], tw['mb-2'], { color: theme.colors.text }]}>
              No students yet
            </Text>
            <Text style={[tw['text-base'], tw['text-center'], tw['mb-6'], { color: theme.colors.textSecondary }]}>
              Start by adding your first student to this standard
            </Text>
            <TouchableOpacity 
              style={[tw['py-3'], tw['px-6'], tw['rounded-xl'], { backgroundColor: theme.colors.primary }]} 
              onPress={handleAddStudent}
            >
              <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>Add First Student</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

export default StandardDetail;
