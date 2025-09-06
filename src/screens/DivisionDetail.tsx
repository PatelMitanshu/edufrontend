import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
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
import { Student, studentService, CreateStudentData } from '../services/studentService';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types } from '@react-native-documents/picker';
import * as XLSX from 'xlsx';
import { LazyImage } from '../components/LazyImage';

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
          
          // If long press was not activated, do nothing (no tap handling here)
          if (!isLongPressActive) {
            return;
          }// Handle position saving for long press
          const currentDragY = currentDragDistance.current;if (Math.abs(currentDragY) >= 30) {
            // Calculate target position based on drag distance
            const itemHeight = 120;
            const positionChange = Math.round(currentDragY / (itemHeight * 0.6));
            let newIndex = index + positionChange;
            newIndex = Math.max(0, Math.min(students.length - 1, newIndex));if (newIndex !== index) {moveStudentToPosition(student, newIndex);
            }
          }
          
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
        <TouchableOpacity
          onPress={() => handleStudentPress(student)}
          style={[
            tw['w-12'], 
            tw['h-12'], 
            tw['rounded-full'], 
            tw['items-center'], 
            tw['justify-center'], 
            tw['mr-4'],
            tw['overflow-hidden'],
            { backgroundColor: theme.colors.primary }
          ]}
          activeOpacity={0.7}
        >
          {student.profilePicture?.url ? (
            <LazyImage
              uri={student.profilePicture.url}
              fallback={
                <Text style={[tw['text-base'], tw['font-bold'], { color: theme.colors.surface }]}>
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              }
              style={[tw['w-12'], tw['h-12'], tw['rounded-full']]}
            />
          ) : (
            <Text style={[tw['text-base'], tw['font-bold'], { color: theme.colors.surface }]}>
              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
        <View style={[tw['flex-1']]}>
          <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>
            {student.name}
          </Text>
          {student.rollNumber && (
            <Text style={[tw['text-sm'], tw['font-medium'], tw['mb-1'], { color: theme.colors.primary }]}>
              Roll No: {student.rollNumber}
            </Text>
          )}
          {student.uid && (
            <Text
              numberOfLines={1}
              ellipsizeMode="middle"
              style={[tw['text-sm'], { color: theme.colors.textSecondary }]}
            >
              UID: {student.uid}
            </Text>
          )}
          {student.parentContact?.phone && (
            <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
              📞 {student.parentContact.phone}
            </Text>
          )}
        </View>
        
        {/* Drag Handle - Only this area is draggable */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            tw['w-10'], 
            tw['h-10'], 
            tw['rounded-lg'], 
            tw['items-center'], 
            tw['justify-center'], 
            tw['ml-3'],
            { 
              backgroundColor: theme.colors.border,
              opacity: isDragging ? 0.8 : 0.6 
            }
          ]}
        >
          <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>☰</Text>
        </Animated.View>
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
  const [showEditOptionsModal, setShowEditOptionsModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  
  // Edit students from Excel states
  const [showEditExcelModal, setShowEditExcelModal] = useState(false);
  const [editPreviewStudents, setEditPreviewStudents] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);

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
      Alert.alert('Excel Import Error', `Error: ${error.message}\n\nIf this persists, please contact support.`);
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
      const studentsData: CreateStudentData[] = [];
      const errors: string[] = [];
      
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
      
      // Check for duplicate UIDs in the Excel data
      const uidCounts: { [key: string]: number } = {};
      const duplicateUIDs: string[] = [];
      
      // Get the highest existing roll number to continue sequential numbering
      const getNextRollNumber = () => {
        const existingRollNumbers = students
          .map(student => parseInt(student.rollNumber || '0'))
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a); // Sort descending
        
        const highestRollNumber = existingRollNumbers.length > 0 ? existingRollNumbers[0] : 0;
        return highestRollNumber + 1;
      };
      
      let nextRollNumber = getNextRollNumber();
      
      // Assign sequential roll numbers to imported students
      studentsData.forEach((student, index) => {
        // Assign roll number if not already set
        if (!student.rollNumber) {
          student.rollNumber = (nextRollNumber + index).toString();
        }
      });
      
      // Check for duplicate roll numbers within the imported batch
      const rollNumberCounts: { [key: string]: number } = {};
      const duplicateRollNumbers: string[] = [];
      
      studentsData.forEach((student) => {
        if (student.rollNumber) {
          rollNumberCounts[student.rollNumber] = (rollNumberCounts[student.rollNumber] || 0) + 1;
          if (rollNumberCounts[student.rollNumber] > 1 && !duplicateRollNumbers.includes(student.rollNumber)) {
            duplicateRollNumbers.push(student.rollNumber);
          }
        }
      });
      
      if (duplicateRollNumbers.length > 0) {
        Alert.alert(
          'Duplicate Roll Numbers Found',
          `The following roll numbers appear multiple times in your Excel file:\n\n${duplicateRollNumbers.join(', ')}\n\nPlease fix these duplicates and try again.`
        );
        return;
      }
      
      // Check for conflicts with existing students' roll numbers
      const existingRollNumbers = students.map(student => student.rollNumber).filter(Boolean);
      const conflictingRollNumbers = studentsData
        .filter(student => student.rollNumber && existingRollNumbers.includes(student.rollNumber))
        .map(student => student.rollNumber);
      
      if (conflictingRollNumbers.length > 0) {
        Alert.alert(
          'Roll Number Conflicts',
          `The following roll numbers already exist in this division:\n\n${[...new Set(conflictingRollNumbers)].join(', ')}\n\nThese students will be assigned new sequential roll numbers.`
        );
        
        // Reassign conflicting roll numbers
        studentsData.forEach((student, index) => {
          if (student.rollNumber && existingRollNumbers.includes(student.rollNumber)) {
            student.rollNumber = (nextRollNumber + studentsData.length + index).toString();
          }
        });
      }
      
      studentsData.forEach((student, index) => {
        if (student.uid) {
          if (!uidCounts[student.uid]) {
            uidCounts[student.uid] = 0;
          }
          uidCounts[student.uid]++;
          
          if (uidCounts[student.uid] === 2) {
            duplicateUIDs.push(student.uid);
          }
        }
      });
      
      if (duplicateUIDs.length > 0) {
        const duplicateDetails = duplicateUIDs.map(uid => {
          const studentsWithUID = studentsData
            .map((student, index) => ({ ...student, rowIndex: index }))
            .filter(student => student.uid === uid);
          return `UID "${uid}": Found in ${studentsWithUID.length} rows (${studentsWithUID.map(s => s.name).join(', ')})`;
        });
        
        Alert.alert(
          'Duplicate UIDs Found',
          `The following UIDs appear multiple times in your Excel file:\n\n${duplicateDetails.slice(0, 3).join('\n')}${duplicateDetails.length > 3 ? '\n...and more' : ''}\n\nPlease fix these duplicates and try again.`
        );
        return;
      }
      
      // Import students
      console.log('Importing students with roll numbers:', studentsData.map(s => ({name: s.name, rollNumber: s.rollNumber, uid: s.uid})));
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

  const parseStudentRow = (row: any[], columnMap: any, rowNumber: number): CreateStudentData => {
    // Required fields validation - but more lenient for edit operations
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
    
    // Mobile number validation - more flexible for edit operations
    let mobile = '';
    if (rawMobile !== null && rawMobile !== undefined && rawMobile !== '') {
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
      throw new Error(`Invalid email format: "${email}"`);
    }

    // Parse date of birth in DD-MM-YYYY format
    if (dateOfBirth) {
      // Handle various date formats
      if (dateOfBirth.includes('/')) {
        dateOfBirth = dateOfBirth.replace(/\//g, '-');
      }
      
      // Parse DD-MM-YYYY format
      const datePattern = /^\d{1,2}-\d{1,2}-\d{4}$/;
      if (!datePattern.test(dateOfBirth)) {
        // Try to parse Excel date number
        const excelDate = parseFloat(dateOfBirth);
        if (!isNaN(excelDate) && excelDate > 0) {
          // Excel date to JS date conversion (Excel starts from 1900-01-01)
          const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
          const day = jsDate.getUTCDate().toString().padStart(2, '0');
          const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
          const year = jsDate.getUTCFullYear();
          dateOfBirth = `${day}-${month}-${year}`;
        } else {
          throw new Error(`Invalid date format. Expected DD-MM-YYYY, got: "${dateOfBirth}"`);
        }
      }
    }

    const studentData: CreateStudentData = {
      name,
      uid,
      standardId,
      divisionId,
      parentContact: {
        phone: mobile,
        email: email || undefined,
      },
      rollNumber: rollNumber || undefined,
      dateOfBirth: dateOfBirth || undefined,
    };

    return studentData;
  };


  // Flexible parsing function for editing existing students
  const parseStudentRowForEdit = (row: any[], columnMap: any, rowNumber: number): Partial<CreateStudentData> => {
    const editData: Partial<CreateStudentData> = {};
    
    // UID is required to match existing students
    const rawUid = row[columnMap.uid];
    if (rawUid !== null && rawUid !== undefined) {
      const uid = rawUid.toString().trim();
      if (uid && uid.length > 0) {
        editData.uid = uid;
      }
    }
    
    // Name is optional for editing
    const rawName = row[columnMap.name];
    if (rawName !== null && rawName !== undefined) {
      const name = rawName.toString().trim();
      if (name && name.length > 0) {
        editData.name = name;
      }
    }
    
    // Mobile is optional for editing
    const rawMobile = row[columnMap.mobile];
    if (rawMobile !== null && rawMobile !== undefined && rawMobile !== '') {
      try {
        let mobileStr = rawMobile.toString();
        
        // Handle scientific notation (like 9.37484e+9)
        if (mobileStr.includes('e+') || mobileStr.includes('E+')) {
          const num = parseFloat(mobileStr);
          mobileStr = Math.round(num).toString();
        }
        
        // Remove all non-digit characters
        let mobile = mobileStr.replace(/\D/g, '');
        
        // Handle numbers that might have country code (+91)
        if (mobile.length === 12 && mobile.startsWith('91')) {
          mobile = mobile.substring(2);
        }
        
        // Validate mobile number if provided
        if (mobile.length === 10 && /^[6-9]\d{9}$/.test(mobile)) {
          if (!editData.parentContact) editData.parentContact = {};
          editData.parentContact.phone = mobile;
        } else if (mobile.length > 0) {
          throw new Error(`Invalid mobile number: "${rawMobile}" (cleaned: "${mobile}")`);
        }
      } catch (error: any) {
        throw new Error(`Mobile number error: ${error.message}`);
      }
    }
    
    // Email is optional
    const rawEmail = row[columnMap.email];
    if (rawEmail !== null && rawEmail !== undefined) {
      const email = rawEmail.toString().trim();
      if (email && email.length > 0) {
        if (/\S+@\S+\.\S+/.test(email)) {
          if (!editData.parentContact) editData.parentContact = {};
          editData.parentContact.email = email;
        } else {
          throw new Error(`Invalid email format: "${email}"`);
        }
      }
    }
    
    // Roll number is optional
    const rawRollNumber = row[columnMap.rollNumber];
    if (rawRollNumber !== null && rawRollNumber !== undefined) {
      const rollNumber = rawRollNumber.toString().trim();
      if (rollNumber && rollNumber.length > 0) {
        editData.rollNumber = rollNumber;
      }
    }
    
    // Date of birth is optional
    const rawDateOfBirth = row[columnMap.dateOfBirth];
    if (rawDateOfBirth !== null && rawDateOfBirth !== undefined) {
      try {
        let dateOfBirth = rawDateOfBirth.toString().trim();
        if (dateOfBirth && dateOfBirth.length > 0) {
          // Handle various date formats
          if (dateOfBirth.includes('/')) {
            dateOfBirth = dateOfBirth.replace(/\//g, '-');
          }
          
          // Parse DD-MM-YYYY format
          const datePattern = /^\d{1,2}-\d{1,2}-\d{4}$/;
          if (!datePattern.test(dateOfBirth)) {
            // Try to parse Excel date number
            const excelDate = parseFloat(dateOfBirth);
            if (!isNaN(excelDate) && excelDate > 0) {
              const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
              const day = jsDate.getUTCDate().toString().padStart(2, '0');
              const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
              const year = jsDate.getUTCFullYear();
              dateOfBirth = `${day}-${month}-${year}`;
            } else {
              throw new Error(`Invalid date format: "${rawDateOfBirth}"`);
            }
          }
          editData.dateOfBirth = dateOfBirth;
        }
      } catch (error: any) {
        throw new Error(`Date of birth error: ${error.message}`);
      }
    }
    
    return editData;
  };
  

  const importStudentsBatch = async (studentsData: CreateStudentData[]) => {
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
    setShowEditOptionsModal(true);
  };

  const handleEditDivisionName = () => {
    setShowEditOptionsModal(false);
    navigation.navigate('EditDivision', { divisionId });
  };

  const handleEditStudentsFromExcel = async () => {
    setShowEditOptionsModal(false);
    try {
      const result = await pick({
        type: [types.xlsx, types.xls],
      });

      if (result.length > 0) {
        setEditLoading(true);
        setShowEditExcelModal(true);
        await processEditExcelFile(result[0]);
      }
    } catch (error: any) {
      if (error.message !== 'User canceled document picker') {
        Alert.alert('Error', 'Failed to select Excel file');
      }
    }
  };

  const processEditExcelFile = async (file: any) => {
    try {
      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        Alert.alert('Error', 'Excel file must contain at least a header row and one data row');
        setShowEditExcelModal(false);
        return;
      }

      const headers = jsonData[0] as string[];
      const columnMap = mapExcelColumns(headers);

      // Enforce same format as Add: require Name, UID, Mobile columns
      if (!columnMap.name || !columnMap.uid || !columnMap.mobile) {
        Alert.alert('Error', 'Excel must include Name, UID, and Mobile Number columns (same as Add format).');
        setShowEditExcelModal(false);
        return;
      }

      const editData: any[] = [];
      const notFoundUIDs: string[] = [];
      const invalidRows: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => cell === null || cell === undefined || cell.toString().trim() === '')) continue;

        // Parse leniently for edit (UID required, other fields optional)
        let parsed: Partial<CreateStudentData>;
        try {
          parsed = parseStudentRowForEdit(row, columnMap, i + 1);
        } catch (e: any) {
          invalidRows.push(`Row ${i + 1}: ${e.message}`);
          continue;
        }

        const uid = parsed.uid?.toString().trim();
        if (!uid) {
          invalidRows.push(`Row ${i + 1}: Missing UID`);
          continue;
        }

        const existing = students.find(s => s.uid === uid);
        if (!existing) {
          notFoundUIDs.push(uid);
          continue;
        }

        // Build a full newData object by overlaying provided fields onto existing
        const newData: CreateStudentData = {
          name: parsed.name ?? existing.name,
          uid: existing.uid,
          standardId,
          divisionId,
          parentContact: {
            phone: parsed.parentContact?.phone ?? existing.parentContact?.phone,
            email: parsed.parentContact?.email ?? existing.parentContact?.email,
          },
          rollNumber: parsed.rollNumber ?? existing.rollNumber,
          dateOfBirth: parsed.dateOfBirth ?? existing.dateOfBirth,
        };

        const changes = detectChanges(existing, newData);
        if (changes.length > 0) {
          editData.push({ existingStudent: existing, newData, changes, rowNumber: i + 1 });
        }
      }

      if (invalidRows.length > 0) {
        Alert.alert(
          'Invalid Rows Found',
          `${invalidRows.length} rows have errors:\n\n${invalidRows.slice(0, 3).join('\n')}${invalidRows.length > 3 ? '\n...and more' : ''}\n\nThese rows will be skipped.`
        );
      }

      if (notFoundUIDs.length > 0) {
        Alert.alert(
          'Students Not Found',
          `${notFoundUIDs.length} UIDs were not found in this division:\n\n${notFoundUIDs.slice(0, 5).join(', ')}${notFoundUIDs.length > 5 ? '\n...and more' : ''}\n\nThese will be skipped.`
        );
      }

      if (editData.length === 0) {
        const totalProcessed = (jsonData.length - 1) - invalidRows.length - notFoundUIDs.length;
        let message = 'No changes were detected for any existing students';
        if (totalProcessed > 0) {
          message += `\n\n📊 Summary:\n• ${totalProcessed} students processed\n• All data matches current records\n• Excel file is up to date with current data`;
        }
        Alert.alert('Excel Check Complete', message);
        setShowEditExcelModal(false);
        return;
      }

      setEditPreviewStudents(editData);
    } catch (error: any) {
      Alert.alert('Error', `Failed to process Excel file: ${error.message}`);
      setShowEditExcelModal(false);
    } finally {
      setEditLoading(false);
    }
  };

  const detectChanges = (existing: Student, newData: CreateStudentData) => {
    const changes: any[] = [];

    const normalizeString = (str?: string) => (str ? str.toString().trim() : '');

    const normalizeName = (s?: string) => normalizeString(s).toLowerCase();

    const normalizePhone = (p?: string) => {
      if (!p) return '';
      const digits = p.toString().replace(/\D/g, '');
      // If more than 10 digits, take last 10 (handles country codes like 91)
      return digits.length > 10 ? digits.slice(-10) : digits;
    };

    const normalizeDOB = (d?: string) => {
      if (!d) return '';
      const s = d.toString().trim();
      // dd-mm-yyyy
      const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
      const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      if (dmy.test(s)) {
        const m = s.match(dmy)!;
        const day = m[1].padStart(2, '0');
        const month = m[2].padStart(2, '0');
        const year = m[3];
        return `${year}-${month}-${day}`; // yyyy-mm-dd
      }
      if (ymd.test(s)) {
        const m = s.match(ymd)!;
        const year = m[1];
        const month = m[2].padStart(2, '0');
        const day = m[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      // Try Date.parse fallback
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const mm = (parsed.getMonth() + 1).toString().padStart(2, '0');
        const dd = parsed.getDate().toString().padStart(2, '0');
        return `${y}-${mm}-${dd}`;
      }
      return s;
    };

    // Name (case-insensitive)
    if (normalizeName(existing.name) !== normalizeName(newData.name)) {
      changes.push({ field: 'Name', old: existing.name, new: newData.name });
    }

    // Phone
    if (normalizePhone(existing.parentContact?.phone) !== normalizePhone(newData.parentContact?.phone)) {
      changes.push({ field: 'Phone', old: existing.parentContact?.phone || 'Not set', new: newData.parentContact?.phone || 'Not set' });
    }

    // Email (case-insensitive)
    if (normalizeString(existing.parentContact?.email).toLowerCase() !== normalizeString(newData.parentContact?.email).toLowerCase()) {
      changes.push({ field: 'Email', old: existing.parentContact?.email || 'Not set', new: newData.parentContact?.email || 'Not set' });
    }

    // Date of Birth compare normalized to yyyy-mm-dd
    if (normalizeDOB(existing.dateOfBirth) !== normalizeDOB(newData.dateOfBirth)) {
      changes.push({ field: 'Date of Birth', old: existing.dateOfBirth || 'Not set', new: newData.dateOfBirth || 'Not set' });
    }

    // Roll number (trim)
    if (newData.rollNumber) {
      if (normalizeString(existing.rollNumber) !== normalizeString(newData.rollNumber)) {
        changes.push({ field: 'Roll Number', old: existing.rollNumber || 'Not set', new: newData.rollNumber });
      }
    }

    return changes;
  };

  const applyEditChanges = async () => {
    try {
      setEditLoading(true);

      const invalidDobRows: string[] = [];
      const updatePromises: Promise<any>[] = [];

      for (const item of editPreviewStudents) {
        const updateData: any = {};

        for (const change of item.changes) {
          switch (change.field) {
            case 'Name':
              updateData.name = change.new;
              break;
            case 'Phone':
              updateData.parentContact = {
                ...item.existingStudent.parentContact,
                phone: change.new === 'Not set' ? undefined : change.new,
              };
              break;
            case 'Email':
              updateData.parentContact = {
                ...(updateData.parentContact || item.existingStudent.parentContact),
                email: change.new === 'Not set' ? undefined : change.new,
              };
              break;
            case 'Date of Birth':
              if (change.new === 'Not set') {
                updateData.dateOfBirth = undefined;
              } else {
                const raw = (change.new || '').toString().trim();
                const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
                const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
                let normalized: string | null = null;
                if (dmy.test(raw)) {
                  const m = raw.match(dmy)!;
                  const day = m[1].padStart(2, '0');
                  const month = m[2].padStart(2, '0');
                  const year = m[3];
                  normalized = `${year}-${month}-${day}`;
                } else if (ymd.test(raw)) {
                  const m = raw.match(ymd)!;
                  const year = m[1];
                  const month = m[2].padStart(2, '0');
                  const day = m[3].padStart(2, '0');
                  normalized = `${year}-${month}-${day}`;
                } else {
                  const parsed = new Date(raw);
                  if (!isNaN(parsed.getTime())) {
                    const yy = parsed.getFullYear();
                    const mm = (parsed.getMonth() + 1).toString().padStart(2, '0');
                    const dd = parsed.getDate().toString().padStart(2, '0');
                    normalized = `${yy}-${mm}-${dd}`;
                  }
                }

                if (normalized) {
                  updateData.dateOfBirth = normalized;
                } else {
                  invalidDobRows.push(`Row ${item.rowNumber}: Invalid DOB "${change.new}" for ${item.existingStudent.name}`);
                }
              }
              break;
            case 'Roll Number':
              updateData.rollNumber = change.new;
              break;
          }
        }

        updatePromises.push(studentService.updateStudent(item.existingStudent._id, updateData));
      }

      const results = await Promise.allSettled(updatePromises);
      const failed: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          const item = editPreviewStudents[idx];
          failed.push(`${item.existingStudent.name} (UID: ${item.existingStudent.uid}): ${r.reason?.message || 'Update failed'}`);
        }
      });

      if (invalidDobRows.length > 0) {
        Alert.alert('Invalid Date of Birth', `${invalidDobRows.length} rows had invalid DOB and were skipped:\n\n${invalidDobRows.slice(0, 5).join('\n')}${invalidDobRows.length > 5 ? '\n...and more' : ''}`);
      }

      if (failed.length > 0) {
        Alert.alert('Partial Failure', `${failed.length} updates failed:\n\n${failed.slice(0,5).join('\n')}${failed.length > 5 ? '\n...and more' : ''}`);
      }

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      if (successCount > 0) {
        Alert.alert('Success', `${successCount} students updated successfully!`);
        setShowEditExcelModal(false);
        setEditPreviewStudents([]);
        await loadStudents(); // Reload students to show changes
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to update students: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
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
    try {
      // First, try to sort by roll number if available
      const sortedStudents = [...students].sort((a, b) => {
        const rollA = parseInt(a.rollNumber || '999999');
        const rollB = parseInt(b.rollNumber || '999999');
        
        // If both have valid roll numbers, sort by roll number
        if (!isNaN(rollA) && !isNaN(rollB)) {
          return rollA - rollB;
        }
        
        // If only one has a valid roll number, prioritize it
        if (!isNaN(rollA) && isNaN(rollB)) {
          return -1;
        }
        if (isNaN(rollA) && !isNaN(rollB)) {
          return 1;
        }
        
        // If neither has roll number, sort by name
        return (a.name || '').localeCompare(b.name || '');
      });
      
      return sortedStudents;
    } catch (error) {
      // Error loading positions - continue with default order
      console.error('Error sorting students:', error);
    }
    
    return students;
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
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          updateCellsBatchingPeriod={100}
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

      {/* Edit Options Modal */}
      <Modal
        visible={showEditOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditOptionsModal(false)}
      >
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[
            tw['p-6'], 
            tw['rounded-3xl'],
            { backgroundColor: theme.colors.surface, width: '90%', maxWidth: 350 }
          ]}>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-6'], tw['text-center'], { color: theme.colors.text }]}>
              Edit Options
            </Text>
            
            <TouchableOpacity
              style={[
                tw['p-4'], 
                tw['rounded-2xl'], 
                tw['mb-3'], 
                tw['items-center'],
                { backgroundColor: theme.colors.primary, width: '100%' }
              ]}
              onPress={handleEditDivisionName}
            >
              <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                ✏️ Edit Division Name
              </Text>
              <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                Change division name and details
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
              onPress={handleEditStudentsFromExcel}
            >
              <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                📊 Edit Students from Excel
              </Text>
              <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                Update student data using Excel file
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[tw['p-3'], tw['items-center'], { width: '100%' }]}
              onPress={() => setShowEditOptionsModal(false)}
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

      {/* Edit Students from Excel Modal */}
      <Modal
        visible={showEditExcelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !editLoading && setShowEditExcelModal(false)}
      >
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[
            tw['rounded-3xl'],
            { backgroundColor: theme.colors.surface, width: '95%', maxWidth: 500, maxHeight: '90%' }
          ]}>
            <ScrollView style={[tw['p-6']]} showsVerticalScrollIndicator={false}>
              <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-4'], tw['text-center'], { color: theme.colors.text }]}>
                Edit Students from Excel
              </Text>
              
              {editLoading ? (
                <View style={[tw['p-8'], tw['items-center']]}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[tw['text-base'], tw['mt-3'], tw['text-center'], { color: theme.colors.text }]}>
                    Processing Excel file...
                  </Text>
                </View>
              ) : editPreviewStudents.length > 0 ? (
                <>
                  <View style={[tw['mb-4'], tw['p-4'], tw['rounded-2xl'], { backgroundColor: theme.colors.background }]}>
                    <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-2'], { color: theme.colors.text }]}>
                      📋 Changes Preview
                    </Text>
                    <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
                      Found {editPreviewStudents.length} students with changes. Review and apply:
                    </Text>
                  </View>

                  {editPreviewStudents.map((item, index) => (
                    <View key={item.existingStudent._id} style={[
                      tw['mb-4'], 
                      tw['p-4'], 
                      tw['rounded-2xl'], 
                      { backgroundColor: theme.colors.background }
                    ]}>
                      <View style={[tw['flex-row'], tw['items-center'], tw['mb-3']]}>
                        <View style={[
                          tw['w-8'], 
                          tw['h-8'], 
                          tw['rounded-full'], 
                          tw['items-center'], 
                          tw['justify-center'], 
                          tw['mr-3'],
                          { backgroundColor: theme.colors.primary }
                        ]}>
                          <Text style={[tw['text-xs'], tw['font-bold'], { color: theme.colors.surface }]}>
                            {item.existingStudent.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </Text>
                        </View>
                        <View style={[tw['flex-1']]}>
                          <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.text }]}>
                            {item.existingStudent.name}
                          </Text>
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="middle"
                            style={[tw['text-sm'], { color: theme.colors.textSecondary }]}
                          >
                            UID: {item.existingStudent.uid}
                          </Text>
                        </View>
                      </View>

                      {item.changes.map((change: any, changeIndex: number) => (
                        <View key={changeIndex} style={[tw['mb-2'], tw['p-4']]}>
                          <Text style={[tw['text-sm'], tw['font-medium'], tw['mb-1'], { color: theme.colors.text }]}>
                            {change.field}:
                          </Text>
                          <View style={[tw['flex-row'], tw['items-center']]}>
                            <Text style={[tw['text-xs'], tw['flex-1'], tw['p-2'], tw['rounded-2xl'], { 
                              backgroundColor: theme.colors.surface, 
                              color: theme.colors.textSecondary 
                            }]}>
                              {change.old}
                            </Text>
                            <Text style={[tw['m-2'], { color: theme.colors.primary }]}>→</Text>
                            <Text style={[tw['text-xs'], tw['flex-1'], tw['p-2'], tw['rounded-2xl'], { 
                              backgroundColor: theme.colors.primary + '20', 
                              color: theme.colors.text 
                            }]}>
                              {change.new}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[
                      tw['p-4'], 
                      tw['rounded-2xl'], 
                      tw['mb-3'], 
                      tw['items-center'],
                      { backgroundColor: theme.colors.primary, width: '100%' }
                    ]}
                    onPress={applyEditChanges}
                    disabled={editLoading}
                  >
                    <Text style={[tw['text-lg'], tw['font-semibold'], { color: theme.colors.surface }]}>
                      ✅ Apply All Changes
                    </Text>
                    <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.surface + '90' }]}>
                      Update {editPreviewStudents.length} students
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[tw['p-8'], tw['items-center']]}>
                  <Text style={[tw['text-base'], tw['mb-3'], tw['text-center'], { color: theme.colors.text }]}>
                    📊 Select Excel File
                  </Text>
                  <Text style={[tw['text-sm'], tw['text-center'], tw['mb-4'], { color: theme.colors.textSecondary }]}>
                    Choose an Excel file with student data to update existing students
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[tw['p-3'], tw['items-center'], { width: '100%' }]}
                onPress={() => setShowEditExcelModal(false)}
                disabled={editLoading}
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
