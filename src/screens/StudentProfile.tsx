import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
  ActionSheetIOS,
  Platform,
  Linking,
  Modal,
  Image,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { studentService, Student } from '../services/studentService';
import { uploadService, Upload } from '../services/uploadService';
import { studentMCQService } from '../services/studentMCQService';
import FileViewer from '../components/FileViewer';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentProfile'>;

function StudentProfile({ route, navigation }: Props) {
  const { studentId } = route.params;
  const [student, setStudent] = useState<Student | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'video' | 'document' | 'image'>('all');
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Upload | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Partial<Student>>({});
  const [fileOptionsVisible, setFileOptionsVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState<Upload | null>(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  
  // MCQ Test statistics state
  const [mcqStats, setMcqStats] = useState({
    availableTests: 0,
    completedTests: 0,
    averageScore: 0,
  });
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqError, setMcqError] = useState(false);
  
  const { theme } = useTheme();

  useEffect(() => {
    loadStudentData();
  }, []);

  // Ensure data is refreshed when screen comes into focus (e.g., after returning from AddUpload)
  useFocusEffect(
    useCallback(() => {
      // reload uploads and student data when focused
      loadStudentData();
    }, [studentId])
  );

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [studentResponse, uploadsResponse] = await Promise.all([
        studentService.getStudent(studentId),
        uploadService.getUploadsForStudent(studentId),
      ]);
      
      setStudent(studentResponse.student);
      setUploads(uploadsResponse.uploads);
      
      // Load MCQ statistics
      await loadMCQStatistics();
    } catch (error) {
      Alert.alert('Error', 'Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMCQStatistics = async () => {
    try {
      setMcqLoading(true);
      setMcqError(false);
      
      // Fetch available tests and test history in parallel
      const [availableTestsResponse, testHistoryResponse] = await Promise.all([
        studentMCQService.getAvailableTests(studentId),
        studentMCQService.getTestHistory(studentId),
      ]);

      const availableTests = availableTestsResponse.tests.length;
      const completedTests = testHistoryResponse.testHistory.length;
      
      // Calculate average score from test history
      let averageScore = 0;
      if (completedTests > 0) {
        const totalScore = testHistoryResponse.testHistory.reduce(
          (sum, test) => sum + test.percentage, 
          0
        );
        averageScore = Math.round(totalScore / completedTests);
      }

      setMcqStats({
        availableTests,
        completedTests,
        averageScore,
      });
    } catch (error) {setMcqError(true);
      // Don't show error alert for MCQ stats as it's not critical
    } finally {
      setMcqLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const handleAddUpload = () => {
    navigation.navigate('AddUpload', { studentId });
  };

  const handleFilePress = (upload: Upload) => {
    // For images and videos, directly open in FileViewer
    if (upload.type === 'image' || upload.type === 'video') {
      setSelectedFile(upload);
      setFileViewerVisible(true);
      return;
    }

    // For documents, show options
    setPendingFile(upload);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Open in App Preview', 'Open in External App'],
          cancelButtonIndex: 0,
          title: `How would you like to open "${upload.title}"?`,
        },
        (buttonIndex) => {
          handleFileOpenOption(upload, buttonIndex);
        }
      );
    } else {
      // For Android, show custom modal
      setFileOptionsVisible(true);
    }
  };

  const handleFileOpenOption = (upload: Upload, optionIndex: number) => {
    switch (optionIndex) {
      case 0: // Cancel (iOS only)
        break;
      case 1: // Open in App Preview
        setSelectedFile(upload);
        setFileViewerVisible(true);
        break;
      case 2: // Open in External App
        Linking.openURL(upload.file.url).catch(() => {
          Alert.alert('Error', 'Could not open file in external app. Please ensure you have a compatible app installed.');
        });
        break;
    }
    setFileOptionsVisible(false);
    setPendingFile(null);
  };

  const handleFileLongPress = (upload: Upload) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete File'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: `"${upload.title}"`,
          message: 'What would you like to do with this file?',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleDeleteUpload(upload);
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        'File Options',
        `What would you like to do with "${upload.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteUpload(upload) }
        ]
      );
    }
  };

  const handleDeleteUpload = (upload: Upload) => {
    Alert.alert(
      'Delete Upload',
      `Are you sure you want to delete "${upload.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await uploadService.deleteUpload(upload._id);
              Alert.alert('Success', 'Upload deleted successfully!');
              // Refresh the uploads list
              loadStudentData();
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || 'Failed to delete upload. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const handleCloseFileViewer = () => {
    setFileViewerVisible(false);
    setSelectedFile(null);
  };

  const getTypeIcon = (type: string, mimeType?: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'document':
        if (mimeType) {
          if (mimeType.includes('pdf')) return '📕';
          if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
          if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
          if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('vnd.ms-excel') || mimeType.includes('sheet')) return '📈';
          if (mimeType.includes('csv')) return '📊';
          if (mimeType.includes('google-apps')) {
            if (mimeType.includes('spreadsheet')) return '📈';
            if (mimeType.includes('document')) return '�';
            if (mimeType.includes('presentation')) return '�📊';
            return '📄';
          }
          if (mimeType.includes('zip')) return '🗜️';
          if (mimeType.includes('text')) return '📝';
          if (mimeType.includes('json') || mimeType.includes('xml')) return '⚙️';
        }
        return '📄';
      default: return '📎';
    }
  };

  const getFilteredUploads = () => {
    if (selectedTab === 'all') return uploads;
    return uploads.filter(upload => upload.type === selectedTab);
  };

  const renderUploadItem = ({ item }: { item: Upload }) => (
    <View
      style={[
        tw['mb-3'], 
        tw['p-4'], 
        tw['rounded-xl'], 
        { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
      ]}
    >
      <TouchableOpacity
        onPress={() => handleFilePress(item)}
        onLongPress={() => handleFileLongPress(item)}
        activeOpacity={0.7}
        style={[tw['mb-3']]}
      >
        <View style={[tw['flex-row'], tw['items-center'], tw['mb-2']]}>
          <Text style={[tw['text-2xl'], tw['mr-3']]}>{getTypeIcon(item.type, item.file.mimeType)}</Text>
          <View style={[tw['flex-1']]}>
            <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[tw['text-sm'], tw['font-medium'], { color: theme.colors.primary }]}>{item.type.toUpperCase()}</Text>
            {item.subject && (
              <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Subject: {item.subject}</Text>
            )}
          </View>
          <View style={[tw['px-3'], tw['py-1'], tw['rounded-lg'], { backgroundColor: theme.colors.primary }]}>
            <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.surface }]}>
              {item.type === 'document' 
                ? (item.file.mimeType.includes('excel') || item.file.mimeType.includes('spreadsheet') || item.file.mimeType.includes('vnd.ms-excel') || item.file.mimeType.includes('sheet')
                    ? '📱 Open ▼' 
                    : 'Open ▼')
                : 'View'}
            </Text>
          </View>
        </View>
        {item.description && (
          <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>{item.description}</Text>
        )}
        <Text style={[tw['text-xs'], { color: theme.colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      handleSaveChanges();
    } else {
      // Start editing
      setEditedStudent({
        name: student?.name || '',
        rollNumber: student?.rollNumber || '',
        uid: student?.uid || '',
        parentContact: {
          phone: student?.parentContact?.phone || '',
          email: student?.parentContact?.email || ''
        }
      });
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (!student?._id) return;
      
      // Only include fields that have been actually edited
      const updateData: any = {};
      
      if (editedStudent.name !== undefined) {
        updateData.name = editedStudent.name;
      }
      
      if (editedStudent.rollNumber !== undefined) {
        updateData.rollNumber = editedStudent.rollNumber;
      }
      
      if (editedStudent.uid !== undefined) {
        updateData.uid = editedStudent.uid;
      }
      
      if (editedStudent.parentContact !== undefined) {
        updateData.parentContact = editedStudent.parentContact;
      }
      
      // Don't send empty update
      if (Object.keys(updateData).length === 0) {
        Alert.alert('Info', 'No changes made to update.');
        setIsEditing(false);
        return;
      }
      
                  const updatedStudent = await studentService.updateStudent(student._id, updateData);
      setStudent(updatedStudent.student);
      setIsEditing(false);
      setEditedStudent({});
      Alert.alert('Success', 'Student profile updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update student profile. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStudent({});
  };

  const handleProfilePictureUpload = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            openCamera();
          } else if (buttonIndex === 2) {
            openImageLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Library', onPress: openImageLibrary },
        ]
      );
    }
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    launchCamera(options, handleImageResponse);
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      uploadProfilePicture(response.assets[0]);
    }
  };

  const uploadProfilePicture = async (asset: any) => {
    if (!student?._id) return;

    try {
      setProfileImageUploading(true);
      
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'profile.jpg',
      } as any);

      const updatedStudent = await studentService.uploadProfilePicture(student._id, formData);
      setStudent(updatedStudent.student);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setProfileImageUploading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedStudent(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Student] as any),
          [child]: value
        }
      }));
    } else {
      setEditedStudent(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[tw['text-lg'], tw['mt-4'], { color: theme.colors.text }]}>Loading student profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <Text style={[tw['text-xl'], { color: theme.colors.text }]}>Student not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      <ScrollView
        style={[tw['flex-1']]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Student Info Card */}
        <View style={[tw['m-4'], tw['p-6'], tw['rounded-xl'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
            <TouchableOpacity
              onPress={isEditing ? handleProfilePictureUpload : undefined}
              style={[
                tw['w-16'], 
                tw['h-16'], 
                tw['rounded-full'], 
                tw['items-center'], 
                tw['justify-center'], 
                tw['mr-4'],
                { backgroundColor: theme.colors.primary },
                isEditing && { borderWidth: 2, borderColor: theme.colors.primaryLight }
              ]}
              disabled={profileImageUploading}
            >
              {profileImageUploading ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : student.profilePicture?.url ? (
                <Image
                  source={{ uri: student.profilePicture.url }}
                  style={[tw['w-16'], tw['h-16'], tw['rounded-full']]}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[tw['text-xl'], tw['font-bold'], { color: theme.colors.surface }]}>
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              )}
              {isEditing && !profileImageUploading && (
                <View style={[
                  tw['rounded-full'], 
                  tw['items-center'], 
                  tw['justify-center'],
                  { 
                    backgroundColor: theme.colors.primary,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 20,
                    height: 20,
                  }
                ]}>
                  <Text style={[tw['text-xs'], { color: theme.colors.surface }]}>✎</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={[tw['flex-1'], ]}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[
                      tw['text-xl'], 
                      tw['font-bold'], 
                      tw['mb-3'], 
                      tw['px-4'], 
                      tw['py-4'], 
                      tw['border'], 
                      tw['rounded-xl'],
                      { 
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1.5,
                        fontSize: 18,
                        minHeight: 50,
                        width: '100%'
                      }
                    ]}
                    value={editedStudent.name || ''}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="Student Name"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <TextInput
                    style={[
                      tw['text-base'], 
                      tw['px-4'], 
                      tw['py-3'], 
                      tw['border'], 
                      tw['rounded-xl'],
                      tw['mb-3'],
                      { 
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1.5,
                        fontSize: 16,
                        minHeight: 45,
                        width: '100%'
                      }
                    ]}
                    value={editedStudent.rollNumber || ''}
                    onChangeText={(text) => updateField('rollNumber', text)}
                    placeholder="Roll Number"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <TextInput
                    style={[
                      tw['text-base'], 
                      tw['px-4'], 
                      tw['py-3'], 
                      tw['border'], 
                      tw['rounded-xl'],
                      { 
                        color: theme.colors.text,
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                        borderWidth: 1.5,
                        fontSize: 16,
                        minHeight: 45,
                        width: '100%'
                      }
                    ]}
                    value={editedStudent.uid || ''}
                    onChangeText={(text) => updateField('uid', text)}
                    placeholder="UID"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </>
              ) : (
                <>
                  <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-2'], { color: theme.colors.text }]}>{student.name}</Text>
                  <Text style={[tw['text-base'], tw['mb-1'], { color: theme.colors.textSecondary }]}>{student.standard.name}</Text>
                  {student.rollNumber && (
                    <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Roll No: {student.rollNumber}</Text>
                  )}
                  {student.uid && (
                    <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>UID: {student.uid}</Text>
                  )}
                </>
              )}
            </View>
            <View style={[tw['ml-3']]}>
              <TouchableOpacity
                style={[
                  tw['px-5'], 
                  tw['py-3'], 
                  tw['rounded-xl'], 
                  tw['shadow-lg'],
                  tw['mb-2'],
                  { 
                    backgroundColor: isEditing ? theme.colors.success : theme.colors.primary,
                    elevation: 3
                  }
                ]}
                onPress={handleEditToggle}
              >
                <Text style={[tw['text-sm'], tw['font-bold'], { color: '#ffffff' }]}>
                  {isEditing ? '💾 Save' : '✏️ Edit'}
                </Text>
              </TouchableOpacity>
              {isEditing && (
                <TouchableOpacity
                  style={[
                    tw['px-4'], 
                    tw['py-3'], 
                    tw['rounded-xl'], 
                    tw['shadow-lg'],
                    { 
                      backgroundColor: theme.colors.error,
                      elevation: 3
                    }
                  ]}
                  onPress={handleCancelEdit}
                >
                  <Text style={[tw['text-sm'], tw['font-bold'], { color: '#ffffff' }]}>❌ Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={[tw['mt-4'], { paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-3'], { color: theme.colors.text }]}>Parent Contact</Text>
            
            {/* Phone */}
            <View style={[tw['mb-3']]}>
              <Text style={[tw['text-sm'], tw['font-medium'], tw['mb-1'], { color: theme.colors.textSecondary }]}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    tw['text-base'], 
                    tw['px-3'], 
                    tw['py-3'], 
                    tw['border'], 
                    tw['rounded-xl'],
                    tw['mt-1'],
                    { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      borderWidth: 1.5,
                      fontSize: 16
                    }
                  ]}
                  value={editedStudent.parentContact?.phone || student.parentContact?.phone || ''}
                  onChangeText={(text) => updateField('parentContact.phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[tw['text-base'], { color: theme.colors.text }]}>
                  {student.parentContact?.phone ? `📞 ${student.parentContact.phone}` : 'Not provided'}
                </Text>
              )}
            </View>

            {/* Email */}
            <View style={[tw['mb-0']]}>
              <Text style={[tw['text-sm'], tw['font-medium'], tw['mb-1'], { color: theme.colors.textSecondary }]}>Email Address</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    tw['text-base'], 
                    tw['px-3'], 
                    tw['py-3'], 
                    tw['border'], 
                    tw['rounded-xl'],
                    tw['mt-1'],
                    { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      borderWidth: 1.5,
                      fontSize: 16
                    }
                  ]}
                  value={editedStudent.parentContact?.email || student.parentContact?.email || ''}
                  onChangeText={(text) => updateField('parentContact.email', text)}
                  placeholder="Enter email address"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={[tw['text-base'], { color: theme.colors.text }]}>
                  {student.parentContact?.email ? `✉️ ${student.parentContact.email}` : 'Not provided'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* MCQ Tests Section */}
        <View style={[tw['m-4'], tw['p-6'], tw['rounded-xl'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['mb-4']]}>
            <Text style={[tw['text-xl'], tw['font-bold'], { color: theme.colors.text }]}>MCQ Tests</Text>
            <TouchableOpacity
              style={[
                tw['px-4'], 
                tw['py-2'], 
                tw['rounded-xl'], 
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => navigation.navigate('MCQTests', { studentId })}
            >
              <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.surface }]}>
                📝 Take Tests
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[tw['flex-row'], tw['justify-between'], tw['mb-2']]}>
            <View style={[tw['items-center']]}>
              {mcqLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.primary }]}>
                  {mcqError ? '–' : mcqStats.availableTests}
                </Text>
              )}
              <Text style={[tw['text-xs'], { color: theme.colors.textSecondary }]}>Available</Text>
            </View>
            <View style={[tw['items-center']]}>
              {mcqLoading ? (
                <ActivityIndicator size="small" color={theme.colors.success} />
              ) : (
                <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.success }]}>
                  {mcqError ? '–' : mcqStats.completedTests}
                </Text>
              )}
              <Text style={[tw['text-xs'], { color: theme.colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[tw['items-center']]}>
              {mcqLoading ? (
                <ActivityIndicator size="small" color={theme.colors.warning} />
              ) : (
                <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.warning }]}>
                  {mcqError ? '–' : (mcqStats.completedTests > 0 ? `${mcqStats.averageScore}%` : '–')}
                </Text>
              )}
              <Text style={[tw['text-xs'], { color: theme.colors.textSecondary }]}>Avg Score</Text>
            </View>
          </View>
          
          <Text style={[tw['text-sm'], tw['text-center'], { color: theme.colors.textSecondary }]}>
            Practice with AI-generated questions and track your progress
          </Text>
        </View>

        {/* Student Work Section */}
        <View style={[tw['m-4'], tw['p-6'], tw['rounded-xl'], { backgroundColor: theme.colors.surface }]}>
          <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-4'], { color: theme.colors.text }]}>Student Work ({uploads.length})</Text>
          
          {/* Filter Tabs */}
          <View style={[tw['flex-row'], tw['mb-2']]}>
            {['all', 'video', 'document', 'image'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  tw['px-2'], 
                  tw['py-2'], 
                  tw['rounded-lg'], 
                  tw['mr-2'],
                  { backgroundColor: selectedTab === tab ? theme.colors.primary : theme.colors.background }
                ]}
                onPress={() => setSelectedTab(tab as any)}
              >
                <Text style={[
                  tw['text-sm'], 
                  tw['font-medium'], 
                  { color: selectedTab === tab ? theme.colors.surface : theme.colors.text }
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Uploads List */}
          <FlatList
            data={getFilteredUploads()}
            renderItem={renderUploadItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={[tw['items-center'], tw['p-8']]}>
                <Text style={[tw['text-4xl'], tw['mb-4']]}>📚</Text>
                <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-2'], { color: theme.colors.text }]}>No uploads yet</Text>
                <Text style={[tw['text-base'], tw['text-center'], { color: theme.colors.textSecondary }]}>
                  Add videos, documents, or images to track student's work
                </Text>
              </View>
            }
          />
          
          {/* Add Upload Button */}
          <TouchableOpacity
            style={[
              tw['mt-4'], 
              tw['py-3'], 
              tw['px-6'], 
              tw['rounded-xl'], 
              tw['items-center'],
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleAddUpload}
          >
            <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>
              📎 Add New Upload
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          visible={fileViewerVisible}
          onClose={handleCloseFileViewer}
          fileUrl={selectedFile.file.url}
          fileType={selectedFile.type}
          fileName={selectedFile.file.originalName}
          mimeType={selectedFile.file.mimeType}
        />
      )}

      {/* File Options Modal (Android/Cross-platform) */}
      <Modal
        visible={fileOptionsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setFileOptionsVisible(false);
          setPendingFile(null);
        }}
      >
        <View style={[tw['flex-1'], { justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[tw['p-6'], { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
            <Text style={[tw['text-lg'], tw['font-bold'], tw['text-center'], tw['mb-6'], { color: theme.colors.text }]}>
              How would you like to open "{pendingFile?.title}"?
            </Text>
            
            <TouchableOpacity
              style={[tw['flex-row'], tw['items-center'], tw['p-4'], tw['mb-2'], tw['rounded-xl'], { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
              onPress={() => pendingFile && handleFileOpenOption(pendingFile, 1)}
            >
              <Text style={[tw['text-3xl'], tw['mr-4']]}>📱</Text>
              <View style={[tw['flex-1']]}>
                <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>Open in App Preview</Text>
                <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
                  View the file inside the app using Google preview
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw['flex-row'], tw['items-center'], tw['p-4'], tw['mb-4'], tw['rounded-xl']]}
              onPress={() => pendingFile && handleFileOpenOption(pendingFile, 2)}
            >
              <Text style={[tw['text-3xl'], tw['mr-4']]}>🚀</Text>
              <View style={[tw['flex-1']]}>
                <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>Open in External App</Text>
                <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
                  Open with Excel, Word, or other installed apps
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw['py-3'], tw['px-6'], tw['rounded-xl'], tw['items-center'], tw['mt-4'], { backgroundColor: theme.colors.error }]}
              onPress={() => {
                setFileOptionsVisible(false);
                setPendingFile(null);
              }}
            >
              <Text style={[tw['text-base'], tw['font-semibold'], tw['text-white']]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default StudentProfile;
