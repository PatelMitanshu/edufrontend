import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { Student, studentService } from '../services/studentService';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DraggableStudentCardProps {
  student: Student;
  index: number;
  students: Student[];
  theme: any;
  tw: any;
  moveStudentToPosition: (student: Student, position: number) => void;
  handleStudentPress: (student: Student) => void;
}

const DraggableStudentCard: React.FC<DraggableStudentCardProps> = ({
  student,
  index,
  students,
  theme,
  tw,
  moveStudentToPosition,
  handleStudentPress,
}) => {
  const dragY = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLongPressActive, setIsLongPressActive] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => isLongPressActive, // Only allow movement after long press
        onPanResponderGrant: (evt) => {
          console.log('Gesture started, waiting for long press');
          
          // Clear any existing timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
          }
          
          // Start long press timer (1000ms = 1 second for longer selection time)
          longPressTimer.current = setTimeout(() => {
            console.log('Long press activated - drag mode enabled');
            setIsLongPressActive(true);
            setIsDragging(true);
            
            // Animate scale up when long press activates
            Animated.parallel([
              Animated.timing(scaleValue, {
                toValue: 1.05,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          }, 1000); // 1 second long press required
        },
        onPanResponderMove: (_, gestureState) => {
          // Only allow movement if long press is active
          if (isLongPressActive) {
            console.log('Moving with dy:', gestureState.dy);
            // Make the container follow finger movement
            dragY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          console.log('Gesture released with dy:', gestureState.dy);
          
          // Clear the long press timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          
          // If long press was not activated, just reset (no profile opening)
          if (!isLongPressActive) {
            console.log('Short press - no action');
            return;
          }
          
          // Reset drag states
          setIsDragging(false);
          setIsLongPressActive(false);
          
          // If it was just a small movement during long press, don't change position
          if (Math.abs(gestureState.dy) < 40) {
            console.log('Drag distance too small, no position change');
            // Just animate back without position change
            Animated.parallel([
              Animated.spring(dragY, {
                toValue: 0,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
            return;
          }
          
          // Calculate target position based on drag distance
          const itemHeight = 120; // Standard item height
          const dragDistance = gestureState.dy;
          console.log('Release with drag distance:', dragDistance);
          
          // Less sensitive position calculation for single position moves
          const positionChange = Math.round(dragDistance / (itemHeight * 0.8)); // Less sensitive
          console.log('Position change calculated:', positionChange);
          
          let newIndex = index + positionChange;
          newIndex = Math.max(0, Math.min(students.length - 1, newIndex));
          
          console.log('Moving from index', index, 'to index', newIndex);
          
          if (newIndex !== index) {
            console.log('Calling moveStudentToPosition');
            moveStudentToPosition(student, newIndex);
          } else {
            console.log('No position change needed');
          }
          
          // Animate back to original position and scale
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderTerminate: () => {
          console.log('Gesture terminated');
          
          // Clear the long press timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          
          // Reset all states
          setIsDragging(false);
          setIsLongPressActive(false);
          
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [student, index, students, moveStudentToPosition, handleStudentPress, isLongPressActive]
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        tw['flex-row'], 
        tw['items-center'], 
        tw['p-4'], 
        tw['mb-3'], 
        tw['rounded-xl'],
        {
          backgroundColor: isDragging ? theme.colors.primaryLight : theme.colors.surface,
          transform: [
            { translateY: dragY },
            { scaleX: scaleValue },
            { scaleY: scaleValue },
          ],
          zIndex: isDragging ? 9999 : 1,
          elevation: isDragging ? 15 : 2,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: isDragging ? 8 : 2,
          },
          shadowOpacity: isDragging ? 0.3 : 0.1,
          shadowRadius: isDragging ? 12 : 4,
        }
      ]}
    >
      {/* Student Info */}
      <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
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
            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <View style={[tw['flex-1']]}>
          <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>
            {student.name}
          </Text>
          {student.rollNumber && (
            <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
              Roll No: {student.rollNumber}
            </Text>
          )}
          {student.parentContact?.phone && (
            <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
              📞 {student.parentContact.phone}
            </Text>
          )}
        </View>
        
        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => handleStudentPress(student)}
          style={[
            tw['w-10'], 
            tw['h-10'], 
            tw['rounded-full'], 
            tw['items-center'], 
            tw['justify-center'], 
            tw['ml-3'],
            { backgroundColor: theme.colors.primary + '20' } // Semi-transparent background
          ]}
          activeOpacity={0.7}
        >
          <Text style={[tw['text-lg'], { color: theme.colors.primary }]}>👤</Text>
        </TouchableOpacity>
        
        <View style={[tw['w-6'], tw['items-center']]}>
          <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>☰</Text>
        </View>
      </View>
    </Animated.View>
  );
};

type Props = NativeStackScreenProps<RootStackParamList, 'DivisionDetail'>;

export default function DivisionDetail({ route, navigation }: Props) {
  const { divisionId, divisionName, standardId, standardName } = route.params;
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: divisionName,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.surface,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={[tw['flex-row'], { gap: 8 }]}>
          <TouchableOpacity
            onPress={handleEditDivision}
            style={[
              tw['px-3'],
              tw['py-2'],
              tw['rounded-full'],
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddStudent}
            style={[
              tw['px-4'],
              tw['py-2'],
              tw['rounded-full'],
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.primary }]}>
              Add Student
            </Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [divisionId, divisionName, theme]);

  useFocusEffect(
    React.useCallback(() => {
      loadStudents();
    }, [divisionId])
  );

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentsByDivision(divisionId);
      const sortedStudents = await loadStudentPositions(response.students);
      setStudents(sortedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    navigation.navigate('AddStudent', { 
      standardId, 
      divisionId, 
      divisionName 
    });
  };

  const handleEditDivision = () => {
    navigation.navigate('EditDivision', { divisionId });
  };

  const handleStudentPress = (student: Student) => {
    navigation.navigate('StudentProfile', { studentId: student._id });
  };

  // Position management functions
  const saveStudentPositions = async (newStudents: Student[]) => {
    try {
      const positions = newStudents.map((student, index) => ({
        studentId: student._id,
        position: index
      }));
      await AsyncStorage.setItem(`student_positions_${divisionId}`, JSON.stringify(positions));
    } catch (error) {
      console.log('Error saving student positions:', error);
    }
  };

  const loadStudentPositions = async (students: Student[]) => {
    try {
      const savedPositions = await AsyncStorage.getItem(`student_positions_${divisionId}`);
      if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        const sortedStudents = [...students].sort((a, b) => {
          const posA = positions.find((p: any) => p.studentId === a._id)?.position ?? students.indexOf(a);
          const posB = positions.find((p: any) => p.studentId === b._id)?.position ?? students.indexOf(b);
          return posA - posB;
        });
        return sortedStudents;
      }
    } catch (error) {
      console.log('Error loading student positions:', error);
    }
    return students;
  };

  const moveStudentToPosition = async (student: Student, newPosition: number) => {
    console.log('moveStudentToPosition called:', student.name, 'to position', newPosition);
    const currentIndex = students.findIndex(s => s._id === student._id);
    console.log('Current index:', currentIndex, 'New position:', newPosition);
    
    if (currentIndex === newPosition) {
      console.log('No change needed, same position');
      return;
    }

    const newStudents = [...students];
    const [movedStudent] = newStudents.splice(currentIndex, 1);
    newStudents.splice(newPosition, 0, movedStudent);
    
    console.log('Updated student order:', newStudents.map(s => s.name));
    setStudents(newStudents);
    await saveStudentPositions(newStudents);
    console.log('Position change completed');
  };

  const renderStudentCard = ({ item, index }: { item: Student, index: number }) => (
    <DraggableStudentCard
      student={item}
      index={index}
      students={students}
      theme={theme}
      tw={tw}
      moveStudentToPosition={moveStudentToPosition}
      handleStudentPress={handleStudentPress}
    />
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {students.length === 0 ? (
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], tw['p-8']]}>
          <View style={[
            tw['w-24'], 
            tw['h-24'], 
            tw['rounded-full'], 
            tw['items-center'], 
            tw['justify-center'], 
            tw['mb-6'],
            { backgroundColor: theme.colors.surface }
          ]}>
            <Text style={[tw['text-4xl']]}>👨‍🎓</Text>
          </View>
          <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-2'], tw['text-center'], { color: theme.colors.text }]}>
            No Students Yet
          </Text>
          <Text style={[tw['text-base'], tw['text-center'], tw['mb-6'], { color: theme.colors.textSecondary }]}>
            Start building your class by adding students to {divisionName}.
          </Text>
          <TouchableOpacity
            style={[
              tw['px-6'], 
              tw['py-3'], 
              tw['rounded-full'],
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleAddStudent}
          >
            <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>
              Add First Student
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={({ item, index }) => renderStudentCard({ item, index })}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[tw['p-4']]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
