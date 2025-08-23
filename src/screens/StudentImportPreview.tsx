import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { studentService } from '../services/studentService';

interface StudentPreviewData {
  id: string; // Temporary ID for preview
  name: string;
  rollNumber?: string;
  uid?: string;
  standardId: string;
  divisionId: string;
  dateOfBirth?: string;
  parentContact?: {
    phone?: string;
    email?: string;
  };
}

interface RouteParams {
  students: StudentPreviewData[];
  divisionName: string;
  standardName: string;
}

type StudentImportPreviewRouteProp = RouteProp<{ params: RouteParams }, 'params'>;

const StudentImportPreview: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<StudentImportPreviewRouteProp>();
  const { students: initialStudents, divisionName, standardName } = route.params;

  const [students, setStudents] = useState<StudentPreviewData[]>(initialStudents);
  const [isLoading, setIsLoading] = useState(false);

  const removeStudent = (studentId: string) => {
    Alert.alert(
      'Remove Student',
      'Are you sure you want to remove this student from the import list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setStudents(prev => prev.filter(student => student.id !== studentId));
          },
        },
      ]
    );
  };

  const saveAllStudents = async () => {
    if (students.length === 0) {
      Alert.alert('No Students', 'No students to save. Please go back and import students.');
      return;
    }

    Alert.alert(
      'Confirm Import',
      `Are you sure you want to import ${students.length} students to ${standardName} - ${divisionName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setIsLoading(true);
            try {
              let successCount = 0;
              let errorCount = 0;
              const errors: string[] = [];

              for (const studentData of students) {
                try {
                  // Remove the temporary ID before sending to API
                  const { id, ...dataToSend } = studentData;
                  await studentService.createStudent(dataToSend);
                  successCount++;
                } catch (error: any) {
                  errorCount++;
                  const errorMessage = error.response?.data?.message || error.message;
                  errors.push(`${studentData.name}: ${errorMessage}`);
                }
              }

              setIsLoading(false);

              // Show results
              const message = `Import completed!\n\nSuccessful: ${successCount}\nFailed: ${errorCount}`;

              if (errorCount > 0) {
                Alert.alert(
                  'Import Results',
                  `${message}\n\nErrors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...and more' : ''}`,
                  [{ 
                    text: 'OK', 
                    onPress: () => navigation.goBack()
                  }]
                );
              } else {
                Alert.alert(
                  'Success',
                  message,
                  [{ 
                    text: 'OK', 
                    onPress: () => navigation.goBack()
                  }]
                );
              }
            } catch (error) {
              setIsLoading(false);
              Alert.alert('Error', 'Failed to import students. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    } catch {
      return dateString;
    }
  };

  const renderStudentCard = ({ item, index }: { item: StudentPreviewData; index: number }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <Text style={styles.studentNumber}>#{index + 1}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeStudent(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.studentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Name:</Text>
          <Text style={styles.detailValue}>{item.name}</Text>
        </View>

        {item.rollNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Roll Number:</Text>
            <Text style={styles.detailValue}>{item.rollNumber}</Text>
          </View>
        )}

        {item.uid && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UID:</Text>
            <Text style={styles.detailValue}>{item.uid}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date of Birth:</Text>
          <Text style={styles.detailValue}>{formatDate(item.dateOfBirth)}</Text>
        </View>

        {item.parentContact?.phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{item.parentContact.phone}</Text>
          </View>
        )}

        {item.parentContact?.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{item.parentContact.email}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Import Preview</Text>
        <Text style={styles.subtitle}>
          {standardName} - {divisionName}
        </Text>
        <Text style={styles.studentCount}>
          {students.length} student{students.length !== 1 ? 's' : ''} ready to import
        </Text>
      </View>

      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students to import</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={students}
            renderItem={renderStudentCard}
            keyExtractor={(item) => item.id}
            style={styles.studentList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={saveAllStudents}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Import {students.length} Student{students.length !== 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 5,
  },
  studentCount: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  studentList: {
    flex: 1,
    padding: 15,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  removeButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  studentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 25,
    backgroundColor: '#ffffff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#757575',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StudentImportPreview;
