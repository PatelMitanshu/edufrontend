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

interface PositionButtonProps {
  student: Student;
  index: number;
  students: Student[];
  theme: any;
  moveStudentUp: (student: Student) => void;
  moveStudentDown: (student: Student) => void;
  moveStudentToPosition: (student: Student, position: number) => void;
}

const PositionButton: React.FC<PositionButtonProps> = ({
  student,
  index,
  students,
  theme,
  moveStudentUp,
  moveStudentDown,
  moveStudentToPosition,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const dragY = React.useRef(new Animated.Value(0)).current;
  const isDragging = React.useRef(false);
  const dragStartY = React.useRef(0);
  
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 5 || isDragging.current;
    },
    onPanResponderGrant: (evt) => {
      dragStartY.current = evt.nativeEvent.pageY;
      // Start animation when gesture begins
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dy } = gestureState;
      
      // Check if this is a long press (hold for 500ms)
      if (!isDragging.current && Math.abs(dy) < 10) {
        setTimeout(() => {
          if (!isDragging.current && Math.abs(gestureState.dy) < 10) {
            isDragging.current = true;
            // Start drag mode
            Animated.spring(animatedValue, {
              toValue: 2, // Drag mode
              useNativeDriver: true,
            }).start();
          }
        }, 500);
      }

      if (isDragging.current) {
        // Update drag position
        dragY.setValue(dy);
        
        // Calculate which position the student should move to
        const itemHeight = 120; // Approximate height of each student card
        const targetIndex = Math.max(0, Math.min(students.length - 1, 
          index + Math.round(dy / itemHeight)));
        
        if (targetIndex !== index) {
          // Visual feedback for target position
          Animated.spring(animatedValue, {
            toValue: 3,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // Regular swipe feedback
        if (Math.abs(dy) > 30) {
          Animated.spring(animatedValue, {
            toValue: dy < 0 ? 2 : 3, // 2 for up, 3 for down
            useNativeDriver: true,
          }).start();
        }
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy } = gestureState;
      
      // Reset animations
      Animated.parallel([
        Animated.spring(animatedValue, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        })
      ]).start();
      
      if (isDragging.current) {
        // Handle drag and drop
        const itemHeight = 120;
        const targetIndex = Math.max(0, Math.min(students.length - 1, 
          index + Math.round(dy / itemHeight)));
        
        if (targetIndex !== index) {
          moveStudentToPosition(student, targetIndex);
        }
        isDragging.current = false;
      } else if (Math.abs(dy) > 30) {
        // Handle regular swipe
        if (dy < 0 && index > 0) {
          moveStudentUp(student);
        } else if (dy > 0 && index < students.length - 1) {
          moveStudentDown(student);
        }
      }
    },
  }), [student, index, students, moveStudentUp, moveStudentDown, moveStudentToPosition]);

  const scaleTransform = animatedValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [1, 1.1, 1.3, 1.2], // Bigger scale for drag mode
  });

  const backgroundColorTransform = animatedValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      theme.colors.primary, 
      theme.colors.primaryLight, 
      '#10B981', // Green for up/drag
      '#EF4444'  // Red for down
    ],
  });

  const opacityTransform = animatedValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [1, 1, 0.8, 0.8], // Slightly transparent during drag
  });

  return (
    <View 
      {...panResponder.panHandlers}
      style={[tw['mr-3'], { flexDirection: 'column', alignItems: 'center' }]}
    >
      <Animated.View
        style={[
          tw['w-10'], 
          tw['h-16'], 
          tw['rounded-full'], 
          tw['items-center'], 
          tw['justify-center'],
          { 
            backgroundColor: backgroundColorTransform,
            borderWidth: 2,
            borderColor: theme.colors.primaryLight,
            transform: [
              { scale: scaleTransform },
              { translateY: isDragging.current ? dragY : 0 }
            ],
            opacity: opacityTransform,
            zIndex: isDragging.current ? 1000 : 1,
          }
        ]}
      >
        <TouchableOpacity
          style={[tw['flex-1'], tw['items-center'], tw['justify-center']]}
          activeOpacity={0.7}
        >
          <Text style={[
            tw['text-xs'], 
            tw['font-bold'], 
            tw['mb-1'],
            { color: theme.colors.surface }
          ]}>
            ↑
          </Text>
          
          <View style={[
            tw['px-2'],
            tw['py-1'],
            { backgroundColor: theme.colors.surface, borderRadius: 4 }
          ]}>
            <Text style={[
              tw['text-xs'], 
              tw['font-bold'],
              { color: theme.colors.primary }
            ]}>
              {index + 1}
            </Text>
          </View>
          
          <Text style={[
            tw['text-xs'], 
            tw['font-bold'], 
            tw['mt-1'],
            { color: theme.colors.surface }
          ]}>
            ↓
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={[
        tw['text-xs'], 
        tw['text-center'], 
        tw['mt-1'],
        tw['font-medium'],
        { color: theme.colors.textSecondary }
      ]}>
        {isDragging.current ? 'Drag' : 'Hold'}
      </Text>
    </View>
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

  const moveStudentUp = async (student: Student) => {
    const currentIndex = students.findIndex(s => s._id === student._id);
    if (currentIndex > 0) {
      const newStudents = [...students];
      [newStudents[currentIndex], newStudents[currentIndex - 1]] = [newStudents[currentIndex - 1], newStudents[currentIndex]];
      setStudents(newStudents);
      await saveStudentPositions(newStudents);
    }
  };

  const moveStudentDown = async (student: Student) => {
    const currentIndex = students.findIndex(s => s._id === student._id);
    if (currentIndex < students.length - 1) {
      const newStudents = [...students];
      [newStudents[currentIndex], newStudents[currentIndex + 1]] = [newStudents[currentIndex + 1], newStudents[currentIndex]];
      setStudents(newStudents);
      await saveStudentPositions(newStudents);
    }
  };

  const moveStudentToPosition = async (student: Student, newPosition: number) => {
    const currentIndex = students.findIndex(s => s._id === student._id);
    if (currentIndex === newPosition) return;

    const newStudents = [...students];
    const [movedStudent] = newStudents.splice(currentIndex, 1);
    newStudents.splice(newPosition, 0, movedStudent);
    
    setStudents(newStudents);
    await saveStudentPositions(newStudents);
  };

  const createPositionButton = (student: Student, index: number) => {
    return (
      <PositionButton
        student={student}
        index={index}
        students={students}
        theme={theme}
        moveStudentUp={moveStudentUp}
        moveStudentDown={moveStudentDown}
        moveStudentToPosition={moveStudentToPosition}
      />
    );
  };

  const renderStudentCard = ({ item, index }: { item: Student, index: number }) => (
    <View style={[
      tw['flex-row'], 
      tw['items-center'], 
      tw['p-4'], 
      tw['mb-3'], 
      tw['rounded-xl'],
      { backgroundColor: theme.colors.surface }
    ]}>
      {/* Single Position Change Button with Gesture */}
      {createPositionButton(item, index)}

      {/* Student Info (Clickable) */}
      <TouchableOpacity
        style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}
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
    </View>
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
