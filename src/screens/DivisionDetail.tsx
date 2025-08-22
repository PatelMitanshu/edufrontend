import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
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
  onDragUpdate: (student: Student, newPosition: number) => void;
  onDragEnd: () => void;
  draggedStudentId: string | null;
  setGlobalIsDragging: (dragging: boolean) => void;
}

const DraggableStudentCard: React.FC<DraggableStudentCardProps> = ({
  student,
  index,
  students,
  theme,
  tw,
  moveStudentToPosition,
  handleStudentPress,
  onDragUpdate,
  onDragEnd,
  draggedStudentId,
  setGlobalIsDragging,
}) => {
  const dragY = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const positionY = React.useRef(new Animated.Value(0)).current;
  const currentDragDistance = React.useRef(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isLongPressActive, setIsLongPressActive] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Animate position changes for non-dragged items
  React.useEffect(() => {
    if (draggedStudentId && draggedStudentId !== student._id) {
      // Smooth animation for other containers when their position changes
      Animated.spring(positionY, {
        toValue: 0, // Always animate to 0, let FlatList handle the actual positioning
        tension: 120,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else if (!draggedStudentId) {
      // Reset position when no drag is active
      Animated.spring(positionY, {
        toValue: 0,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [draggedStudentId, student._id, positionY, index]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {return true; // Always capture the initial touch
        },
        onMoveShouldSetPanResponder: (evt, gestureState) => {// Only capture movement if long press is active OR if there's significant movement
          if (isLongPressActive || Math.abs(gestureState.dy) > 10) {return true;
          }
          return false;
        },
        onPanResponderTerminationRequest: () => {return !isLongPressActive; // Don't allow termination during drag
        },
        onPanResponderGrant: (evt) => {// Clear any existing timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
          }
          
          // Start long press timer
          longPressTimer.current = setTimeout(() => {setIsLongPressActive(true);
            setIsDragging(true);
            setGlobalIsDragging(true);
            
            // Animate scale up when long press activates
            Animated.parallel([
              Animated.timing(scaleValue, {
                toValue: 1.05,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          }, 800);
        },
        onPanResponderMove: (_, gestureState) => {// Only allow movement if long press is active
          if (isLongPressActive) {
            // Track the current drag distance
            currentDragDistance.current = gestureState.dy;// Make the container follow finger movement
            dragY.setValue(gestureState.dy);
            
            // Calculate new position in real-time for live feedback
            const itemHeight = 120;
            const dragDistance = gestureState.dy;
            const positionChange = Math.round(dragDistance / (itemHeight * 0.8));
            let newIndex = index + positionChange;
            newIndex = Math.max(0, Math.min(students.length - 1, newIndex));
            
            // Call real-time update to show visual feedback
            if (newIndex !== index) {onDragUpdate(student, newIndex);
            }
          } else {}
        },
        onPanResponderRelease: (_, gestureState) => {// Clear the long press timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          
          // If long press was not activated, handle as normal tap
          if (!isLongPressActive) {// Check if it was a small movement (tap vs swipe)
            if (Math.abs(gestureState.dy) < 10 && Math.abs(gestureState.dx) < 10) {
              handleStudentPress(student);
            }
            return;
          }// Handle position saving for long press
          const currentDragY = currentDragDistance.current;if (Math.abs(currentDragY) >= 30) {
            // Calculate target position based on drag distance
            const itemHeight = 120;
            const positionChange = Math.round(currentDragY / (itemHeight * 0.6));
            let newIndex = index + positionChange;
            newIndex = Math.max(0, Math.min(students.length - 1, newIndex));if (newIndex !== index) {moveStudentToPosition(student, newIndex);
            }
          } else {}
          
          // Reset drag states
          setIsDragging(false);
          setIsLongPressActive(false);
          setGlobalIsDragging(false); // Re-enable scrolling
          
          // Reset drag distance tracking
          currentDragDistance.current = 0;
          
          // Call onDragEnd to clean up temporary state
          if (draggedStudentId === student._id) {
            // Use a timeout to ensure this runs after the current render cycle
            setTimeout(() => onDragEnd(), 0);
          }
          
          // If it was just a small movement during long press, don't change position
          if (Math.abs(gestureState.dy) < 30) { // Reduced threshold
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
          const dragDistance = gestureState.dy;// Less sensitive position calculation for single position moves
          const positionChange = Math.round(dragDistance / (itemHeight * 0.6)); // More sensitive
          
          let newIndex = index + positionChange;
          newIndex = Math.max(0, Math.min(students.length - 1, newIndex));if (newIndex !== index) {moveStudentToPosition(student, newIndex);
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
                    // Clear the long press timer
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          
          // Reset all states
          setIsDragging(false);
          setIsLongPressActive(false);
          setGlobalIsDragging(false); // Re-enable scrolling
          
          // Reset drag distance tracking
          currentDragDistance.current = 0;
          
          // Call onDragEnd to clean up temporary state
          if (draggedStudentId === student._id) {
            // Use a timeout to ensure this runs after the current render cycle
            setTimeout(() => onDragEnd(), 0);
          }
          
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
    [student, index, students, moveStudentToPosition, handleStudentPress, isLongPressActive, draggedStudentId, onDragUpdate, onDragEnd, positionY]
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
          borderWidth: isDragging ? 2 : 1,
          borderColor: isDragging ? theme.colors.primary : theme.colors.border,
          transform: [
            { translateY: Animated.add(dragY, positionY) },
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
          shadowOpacity: isDragging ? 0.25 : 0.08,
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
          {student.profilePicture?.url ? (
            <Image
              source={{ uri: student.profilePicture.url }}
              style={[tw['w-12'], tw['h-12'], tw['rounded-full']]}
              resizeMode="cover"
            />
          ) : (
            <Text style={[tw['text-base'], tw['font-bold'], { color: theme.colors.surface }]}>
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          )}
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
  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [tempStudents, setTempStudents] = useState<Student[]>([]);
  const [globalIsDragging, setGlobalIsDragging] = useState(false);

  // LayoutAnimation is automatically enabled in New Architecture
  // No need for experimental setup

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
      setTempStudents(sortedStudents);
    } catch (error) {
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
    try {const positions = newStudents.map((student, index) => ({
        studentId: student._id,
        position: index
      }));await AsyncStorage.setItem(`student_positions_${divisionId}`, JSON.stringify(positions));} catch (error) {
      console.error('Error saving positions:', error);
    }
  };

  const loadStudentPositions = async (students: Student[]) => {
    try {const savedPositions = await AsyncStorage.getItem(`student_positions_${divisionId}`);if (savedPositions) {
        const positions = JSON.parse(savedPositions);const sortedStudents = [...students].sort((a, b) => {
          const posA = positions.find((p: any) => p.studentId === a._id)?.position ?? students.indexOf(a);
          const posB = positions.find((p: any) => p.studentId === b._id)?.position ?? students.indexOf(b);return posA - posB;
        });return sortedStudents;
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }return students;
  };

  const moveStudentToPosition = async (student: Student, newPosition: number) => {const currentIndex = students.findIndex(s => s._id === student._id);
    
    if (currentIndex === newPosition) {return;
    }

    const newStudents = [...students];
    const [movedStudent] = newStudents.splice(currentIndex, 1);
    newStudents.splice(newPosition, 0, movedStudent);// Save position first
    await saveStudentPositions(newStudents);
    
    // Then update state to trigger re-render
    setStudents(newStudents);
    setTempStudents(newStudents);};

  const onDragUpdate = (student: Student, newPosition: number) => {
    if (draggedStudentId !== student._id) {
      setDraggedStudentId(student._id);
      setGlobalIsDragging(true);
    }

    const currentIndex = students.findIndex(s => s._id === student._id);
    
    if (currentIndex === newPosition) {
      return;
    }

    // Configure smooth layout animation
    LayoutAnimation.configureNext({
      duration: 250,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
        duration: 150,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.9,
        initialVelocity: 0.2,
        duration: 250,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
        duration: 150,
      },
    });

    // Create temporary reordered list for live preview
    const newStudents = [...students];
    const [movedStudent] = newStudents.splice(currentIndex, 1);
    newStudents.splice(newPosition, 0, movedStudent);
    
    setTempStudents(newStudents);
  };

  const onDragEnd = () => {
    setDraggedStudentId(null);
    setGlobalIsDragging(false);
    // Ensure temp students match actual students when drag ends
    setTempStudents([...students]);
  };

  const renderStudentCard = ({ item, index }: { item: Student, index: number }) => (
    <DraggableStudentCard
      student={item}
      index={index}
      students={draggedStudentId ? tempStudents : students}
      theme={theme}
      tw={tw}
      moveStudentToPosition={moveStudentToPosition}
      handleStudentPress={handleStudentPress}
      onDragUpdate={onDragUpdate}
      onDragEnd={onDragEnd}
      draggedStudentId={draggedStudentId}
      setGlobalIsDragging={setGlobalIsDragging}
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
          key={`flatlist-${students.length}-${students.map(s => s._id).join(',')}`}
          data={draggedStudentId ? tempStudents : students}
          renderItem={({ item, index }) => renderStudentCard({ item, index })}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[tw['p-4']]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          scrollEnabled={!globalIsDragging}
          extraData={[draggedStudentId, students.length, students, globalIsDragging]}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}
