import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { studentService, Student } from '../services/studentService';
import { uploadService, Upload } from '../services/uploadService';
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
  
  const { theme } = useTheme();

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [studentResponse, uploadsResponse] = await Promise.all([
        studentService.getStudent(studentId),
        uploadService.getUploadsForStudent(studentId),
      ]);
      
      setStudent(studentResponse.student);
      setUploads(uploadsResponse.uploads);
    } catch (error) {
      Alert.alert('Error', 'Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    setSelectedFile(upload);
    setFileViewerVisible(true);
  };

  const handleCloseFileViewer = () => {
    setFileViewerVisible(false);
    setSelectedFile(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'image': return '🖼️';
      default: return '📎';
    }
  };

  const getFilteredUploads = () => {
    if (selectedTab === 'all') return uploads;
    return uploads.filter(upload => upload.type === selectedTab);
  };

  const renderUploadItem = ({ item }: { item: Upload }) => (
    <TouchableOpacity
      style={[
        tw['mb-3'], 
        tw['p-4'], 
        tw['rounded-xl'], 
        { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
      ]}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}
    >
      <View style={[tw['flex-row'], tw['items-center'], tw['mb-2']]}>
        <Text style={[tw['text-2xl'], tw['mr-3']]}>{getTypeIcon(item.type)}</Text>
        <View style={[tw['flex-1']]}>
          <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[tw['text-sm'], tw['font-medium'], { color: theme.colors.primary }]}>{item.type.toUpperCase()}</Text>
          {item.subject && (
            <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Subject: {item.subject}</Text>
          )}
        </View>
        <View style={[tw['px-3'], tw['py-1'], tw['rounded-lg'], { backgroundColor: theme.colors.primary }]}>
          <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.surface }]}>View</Text>
        </View>
      </View>
      {item.description && (
        <Text style={[tw['text-sm'], tw['mb-2'], { color: theme.colors.textSecondary }]}>{item.description}</Text>
      )}
      <Text style={[tw['text-xs'], { color: theme.colors.textMuted }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
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
      
      const updateData = {
        name: editedStudent.name,
        rollNumber: editedStudent.rollNumber,
        parentContact: editedStudent.parentContact
      };
      
      const updatedStudent = await studentService.updateStudent(student._id, updateData);
      setStudent(updatedStudent.student);
      setIsEditing(false);
      Alert.alert('Success', 'Student profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update student profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStudent({});
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
            <View style={[
              tw['w-16'], 
              tw['h-16'], 
              tw['rounded-full'], 
              tw['items-center'], 
              tw['justify-center'], 
              tw['mr-4'],
              { backgroundColor: theme.colors.primary }
            ]}>
              <Text style={[tw['text-xl'], tw['font-bold'], { color: theme.colors.surface }]}>
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
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
                </>
              ) : (
                <>
                  <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-2'], { color: theme.colors.text }]}>{student.name}</Text>
                  <Text style={[tw['text-base'], tw['mb-1'], { color: theme.colors.textSecondary }]}>{student.standard.name}</Text>
                  {student.rollNumber && (
                    <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Roll No: {student.rollNumber}</Text>
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
    </SafeAreaView>
  );
}



export default StudentProfile;
