import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { studentService, Student } from '../services/studentService';
import { uploadService, Upload } from '../services/uploadService';
import FileViewer from '../components/FileViewer';

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
      console.error('Error loading student data:', error);
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
      style={styles.uploadCard}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.uploadHeader}>
        <Text style={styles.uploadIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadTitle}>{item.title}</Text>
          <Text style={styles.uploadType}>{item.type.toUpperCase()}</Text>
          {item.subject && (
            <Text style={styles.uploadSubject}>Subject: {item.subject}</Text>
          )}
        </View>
        <View style={styles.uploadAction}>
          <Text style={styles.uploadActionText}>View</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.uploadDescription}>{item.description}</Text>
      )}
      <Text style={styles.uploadDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading student profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Student not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Student Info Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentInitials}>
                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentStandard}>{student.standard.name}</Text>
              {student.rollNumber && (
                <Text style={styles.studentDetail}>Roll No: {student.rollNumber}</Text>
              )}
            </View>
          </View>

          {/* Contact Information */}
          {(student.parentContact?.phone || student.parentContact?.email) && (
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Parent Contact</Text>
              {student.parentContact.phone && (
                <Text style={styles.contactDetail}>📞 {student.parentContact.phone}</Text>
              )}
              {student.parentContact.email && (
                <Text style={styles.contactDetail}>✉️ {student.parentContact.email}</Text>
              )}
            </View>
          )}

          {/* Add Upload Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddUpload}>
            <Text style={styles.addButtonText}>+ Add Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Uploads Section */}
        <View style={styles.uploadsSection}>
          <Text style={styles.sectionTitle}>Student Work ({uploads.length})</Text>
          
          {/* Filter Tabs */}
          <View style={styles.tabContainer}>
            {['all', 'video', 'document', 'image'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, selectedTab === tab && styles.activeTab]}
                onPress={() => setSelectedTab(tab as any)}
              >
                <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
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
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>No uploads yet</Text>
                <Text style={styles.emptySubtext}>
                  Add videos, documents, or images to track student's work
                </Text>
              </View>
            }
          />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
  },
  studentCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInitials: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  studentStandard: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 2,
  },
  studentDetail: {
    fontSize: 14,
    color: '#6c757d',
  },
  contactSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  contactDetail: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  uploadCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  uploadActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  uploadType: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  uploadSubject: {
    fontSize: 12,
    color: '#6c757d',
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
  uploadDate: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StudentProfile;
