import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { Student, studentService } from '../services/studentService';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types } from '@react-native-documents/picker';
import * as XLSX from 'xlsx';

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
          {student.uid && (
            <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
              UID: {student.uid}
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
  
  // Excel import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

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
            onPress={() => setShowAddOptionsModal(true)}
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

  const handleExcelImport = async () => {
    try {
      const result = await pick({
        type: [types.xls, types.xlsx],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        processExcelFile(file);
      }
    } catch (error: any) {
      if (error.message !== 'User canceled document picker') {
        Alert.alert('Error', 'Failed to pick Excel file');
      }
    }
  };

  const processExcelFile = async (file: any) => {
    try {
      setImportLoading(true);
      
      // Read file content
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with headers from first row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        Alert.alert('Error', 'Excel file must contain at least a header row and one data row');
        return;
      }
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      // Map column names (support English and Gujarati)
      const columnMap = mapExcelColumns(headers);
      
      if (!columnMap.name || !columnMap.uid || !columnMap.mobile) {
        Alert.alert(
          'Error', 
          'Excel file must contain columns for Name, UID, and Mobile Number. Please check the required format.'
        );
        return;
      }
      
      // Process students data
      const studentsData = [];
      const errors = [];
      
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because we start from row 2 (after header)
        
        // Skip completely empty rows
        if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
          continue;
        }
        
        try {
          const studentData = parseStudentRow(row, columnMap, rowNumber);
          if (studentData) {
            studentsData.push(studentData);
          }
        } catch (error: any) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }
      
      if (errors.length > 0) {
        Alert.alert(
          'Import Errors', 
          `Found ${errors.length} error(s):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}\n\nFix these errors and try again.`
        );
        return;
      }
      
      if (studentsData.length === 0) {
        Alert.alert('Error', 'No valid student data found in the Excel file');
        return;
      }
      
      // Import students
      await importStudentsBatch(studentsData);
      
    } catch (error: any) {
      Alert.alert('Error', `Failed to process Excel file: ${error.message}`);
    } finally {
      setImportLoading(false);
      setShowImportModal(false);
    }
  };

  const mapExcelColumns = (headers: string[]) => {
    const columnMap: any = {};
    
    headers.forEach((header, index) => {
      const cleanHeader = header.toString().toLowerCase().trim();
      
      // Name mapping (be more specific for "નામ")
      if (cleanHeader === 'નામ' || cleanHeader === 'name' || 
          cleanHeader.includes('student name') || cleanHeader.includes('student નામ')) {
        columnMap.name = index;
      }
      // UID mapping (including specific "ચાઇલ્ડ UID" format)
      else if (cleanHeader.includes('ચાઇલ્ડ uid') || cleanHeader.includes('child uid') ||
               cleanHeader === 'ચાઇલ્ડ uid' || cleanHeader === 'child uid' ||
               cleanHeader.includes('uid') || cleanHeader.includes('id') || cleanHeader.includes('આઈડી')) {
        columnMap.uid = index;
      }
      // Mobile mapping (specifically look for "મોબાઇલ નંબર 1" - be more specific)
      else if (cleanHeader.includes('મોબાઇલ નંબર 1') || cleanHeader.includes('mobile number 1') || 
               (cleanHeader.includes('mobile') && cleanHeader.includes('1') && !cleanHeader.includes('2')) ||
               (cleanHeader.includes('મોબાઇલ') && cleanHeader.includes('1') && !cleanHeader.includes('2')) ||
               (cleanHeader.includes('phone') && cleanHeader.includes('1') && !cleanHeader.includes('2'))) {
        columnMap.mobile = index;
      }
      // Email mapping (optional)
      else if (cleanHeader.includes('email') || cleanHeader.includes('ઈમેલ')) {
        columnMap.email = index;
      }
      // Roll number mapping (optional)
      else if (cleanHeader.includes('roll') || cleanHeader.includes('રોલ')) {
        columnMap.rollNumber = index;
      }
      // Date of birth mapping (including specific "જન્મતારીખ (dd-mm-yyyy)" format)
      else if (cleanHeader.includes('જન્મતારીખ') || cleanHeader.includes('birth') || cleanHeader.includes('dob') || 
               cleanHeader.includes('જન્મ') || cleanHeader.includes('તારીખ')) {
        columnMap.dateOfBirth = index;
      }
    });
    
    return columnMap;
  };

  const parseStudentRow = (row: any[], columnMap: any, rowNumber: number) => {
    // Required fields validation
    const rawName = row[columnMap.name];
    const rawUid = row[columnMap.uid];
    const rawMobile = row[columnMap.mobile];
    
    // Clean and validate name
    let name = '';
    if (rawName !== null && rawName !== undefined) {
      name = rawName.toString().trim();
    }
    
    if (!name || name.length === 0) {
      throw new Error(`Name is required. Got: "${rawName}" (cleaned: "${name}")`);
    }
    
    // Clean and validate UID
    let uid = '';
    if (rawUid !== null && rawUid !== undefined) {
      uid = rawUid.toString().trim();
    }
    
    if (!uid || uid.length === 0) {
      throw new Error(`UID is required. Got: "${rawUid}" (cleaned: "${uid}")`);
    }
    
    if (!rawMobile && rawMobile !== 0) {
      throw new Error('Mobile number is required');
    }
    
    // Clean and validate mobile number
    let mobile = '';
    if (rawMobile !== null && rawMobile !== undefined) {
      let mobileStr = rawMobile.toString();
      
      // Handle scientific notation (like 9.37484e+9)
      if (mobileStr.includes('e+') || mobileStr.includes('E+')) {
        // Convert scientific notation to normal number
        const num = parseFloat(mobileStr);
        mobileStr = Math.round(num).toString();
      }
      
      // Remove all non-digit characters (spaces, dashes, brackets, etc.)
      mobile = mobileStr.replace(/\D/g, '');
      
      // Handle numbers that might have country code (+91)
      if (mobile.length === 12 && mobile.startsWith('91')) {
        mobile = mobile.substring(2); // Remove +91
      }
      
      // Check if mobile number is exactly 10 digits
      if (!mobile || mobile.length !== 10) {
        throw new Error(`Mobile number must be exactly 10 digits. Got: "${rawMobile}" (cleaned: "${mobile}", length: ${mobile.length})`);
      }
      
      // Validate that it starts with valid digits (Indian mobile numbers start with 6-9)
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        throw new Error(`Mobile number must start with 6-9 and be 10 digits. Got: "${rawMobile}" (cleaned: "${mobile}")`);
      }
    } else {
      throw new Error('Mobile number is required');
    }
    
    // Optional fields
    const email = columnMap.email !== undefined ? row[columnMap.email]?.toString().trim() : '';
    const rollNumber = columnMap.rollNumber !== undefined ? row[columnMap.rollNumber]?.toString().trim() : '';
    let dateOfBirth = columnMap.dateOfBirth !== undefined ? row[columnMap.dateOfBirth]?.toString().trim() : '';
    
    // Validate email if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate email if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Handle date format conversion from various Excel formats to yyyy-mm-dd
    if (dateOfBirth) {
      let convertedDate = '';
      
      // Remove any extra spaces and convert to string
      const dateStr = dateOfBirth.toString().trim();
      
      // Check if it's an Excel date serial number (like 41283)
      if (/^\d{5}$/.test(dateStr)) {
        // Convert Excel serial date to JavaScript date
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (parseInt(dateStr) - 2) * 24 * 60 * 60 * 1000);
        const day = jsDate.getDate().toString().padStart(2, '0');
        const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
        const year = jsDate.getFullYear();
        convertedDate = `${year}-${month}-${day}`;
      }
      // Check if it's in dd-mm-yyyy format
      else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        convertedDate = `${year}-${month}-${day}`;
      }
      // Check if it's in dd/mm/yyyy format
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        convertedDate = `${year}-${month}-${day}`;
      }
      // Check if it's already in yyyy-mm-dd format
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        convertedDate = dateStr;
      }
      // Check if it's in ISO date format
      else if (Date.parse(dateStr)) {
        const jsDate = new Date(dateStr);
        const day = jsDate.getDate().toString().padStart(2, '0');
        const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
        const year = jsDate.getFullYear();
        convertedDate = `${year}-${month}-${day}`;
      }
      else {
        throw new Error(`Date of Birth format not recognized. Expected dd-mm-yyyy format, got: ${dateStr}`);
      }
      
      // Validate the final converted date
      const parsedDate = new Date(convertedDate);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date of birth: ${dateStr}`);
      }
      
      dateOfBirth = convertedDate;
    }
    
    return {
      name,
      rollNumber: undefined, // Keep rollNumber separate from UID
      uid: uid, // Map UID to uid field
      standardId: standardId, // Backend expects standardId, not standard
      divisionId: divisionId, // Backend expects divisionId, not division
      dateOfBirth: dateOfBirth || undefined,
      parentContact: {
        phone: mobile,
        email: email || undefined,
      },
    };
  };

  const importStudentsBatch = async (studentsData: any[]) => {
    try {
      // Generate temporary IDs for preview
      const studentsWithIds = studentsData.map((student, index) => ({
        ...student,
        id: `temp_${Date.now()}_${index}`, // Temporary ID for preview
      }));

      // Navigate to preview screen using push to avoid type issues
      (navigation as any).navigate('StudentImportPreview', {
        students: studentsWithIds,
        divisionName: divisionName,
        standardName: standardName,
      });

      // Close the import modal
      setShowImportModal(false);
      setImportLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare student preview');
      setImportLoading(false);
    }
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
      // Error saving positions - continue silently
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
      // Error loading positions - continue with default order
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
            onPress={() => setShowAddOptionsModal(true)}
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

      {/* Add Options Modal */}
      <Modal
        visible={showAddOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddOptionsModal(false)}
      >
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[
            tw['p-6'], 
            tw['rounded-3xl'],
            { backgroundColor: theme.colors.surface, width: '90%', maxWidth: 350 }
          ]}>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-6'], tw['text-center'], { color: theme.colors.text }]}>
              Add Students
            </Text>
            
            <TouchableOpacity
              style={[
                tw['p-4'], 
                tw['rounded-2xl'], 
                tw['mb-3'], 
                tw['items-center'],
                { backgroundColor: theme.colors.primary, width: '100%' }
              ]}
              onPress={() => {
                setShowAddOptionsModal(false);
                handleAddStudent();
              }}
            >
              <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                👤 Add Manually
              </Text>
              <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                Add one student at a time
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                tw['p-4'], 
                tw['rounded-2xl'], 
                tw['mb-4'], 
                tw['items-center'],
                { backgroundColor: theme.colors.primary, width: '100%' }
              ]}
              onPress={() => {
                setShowAddOptionsModal(false);
                setShowImportModal(true);
              }}
            >
              <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                📊 Import from Excel
              </Text>
              <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                Bulk import from spreadsheet
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[tw['p-3'], tw['items-center'], { width: '100%' }]}
              onPress={() => setShowAddOptionsModal(false)}
            >
              <Text style={[tw['text-base'], tw['font-medium'], { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Excel Import Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[
            tw['rounded-3xl'],
            { backgroundColor: theme.colors.surface, width: '90%', maxWidth: 450, maxHeight: '85%' }
          ]}>
            <ScrollView style={[tw['p-6']]} showsVerticalScrollIndicator={false}>
              <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-4'], tw['text-center'], { color: theme.colors.text }]}>
                Import Students from Excel
              </Text>
              
              <View style={[tw['mb-6'], tw['p-4'], tw['rounded-2xl'], { backgroundColor: theme.colors.background }]}>
                <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-3'], { color: theme.colors.text }]}>
                  📋 Required Columns:
                </Text>
                <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>નામ</Text> - Student's full name
                </Text>
                <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>ચાઇલ્ડ UID</Text> - Unique student ID
                </Text>
                <Text style={[tw['text-sm'], tw['mb-3'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>મોબાઇલ નંબર 1</Text> - 10-digit phone number
                </Text>
                
                <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-3'], { color: theme.colors.text }]}>
                  📝 Optional Columns:
                </Text>
                <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>Email</Text> (ઈમેલ) - Parent's email address
                </Text>
                <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>Roll Number</Text> (રોલ) - Student's roll number
                </Text>
                <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
                  • <Text style={[tw['font-semibold']]}>જન્મતારીખ (dd-mm-yyyy)</Text> - Date of birth in dd-mm-yyyy format
                </Text>
              </View>
              
              <View style={[tw['mb-6'], tw['p-4'], tw['rounded-2xl'], { backgroundColor: theme.colors.background }]}>
                <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-3'], { color: theme.colors.text }]}>
                  📊 Example Excel Format:
                </Text>
                <View style={[tw['bg-white'], tw['p-3'], tw['rounded-lg'], tw['border'], { borderColor: theme.colors.primary + '30' }]}>
                  <Text style={[tw['text-xs'], { color: '#000', fontFamily: 'monospace' }]}>
                    ચાઇલ્ડ UID | નામ      | મોબાઇલ નંબર 1 | જન્મતારીખ (dd-mm-yyyy){'\n'}
                    001       | રાજ પટેલ  | 9876543210   | 15-08-2010{'\n'}
                    002       | નીતા શાહ  | 9876543211   | 22-03-2011{'\n'}
                    003       | અમિત પટેલ | 9876543212   | 10-12-2010
                  </Text>
                </View>
              </View>
              
              <View style={[tw['mb-6'], tw['p-4'], tw['rounded-2xl'], { backgroundColor: '#FFF3CD' }]}>
                <Text style={[tw['text-sm'], tw['font-medium'], { color: '#856404' }]}>
                  💡 Tips:{'\n'}
                  • Use exact column names: ચાઇલ્ડ UID, નામ, મોબાઇલ નંબર 1{'\n'}
                  • First row should contain column headers{'\n'}
                  • Mobile numbers must be exactly 10 digits{'\n'}
                  • Date format: dd-mm-yyyy (e.g., 15-08-2010){'\n'}
                  • Email format will be validated if provided
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  tw['p-4'], 
                  tw['rounded-2xl'], 
                  tw['mb-3'], 
                  tw['items-center'],
                  { 
                    backgroundColor: importLoading ? theme.colors.textSecondary : theme.colors.primary,
                    opacity: importLoading ? 0.7 : 1,
                    width: '100%'
                  }
                ]}
                onPress={handleExcelImport}
                disabled={importLoading}
              >
                {importLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.surface} />
                ) : (
                  <>
                    <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                      📁 Choose Excel File
                    </Text>
                    <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                      Select .xlsx or .xls file
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw['p-3'], tw['items-center'], { width: '100%' }]}
                onPress={() => setShowImportModal(false)}
                disabled={importLoading}
              >
                <Text style={[tw['text-base'], tw['font-medium'], { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
