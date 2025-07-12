import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { studentService } from '../services/studentService';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStudent'>;

function AddStudent({ route, navigation }: Props) {
  const { standardId } = route.params;
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    if (parentPhone && !/^\d{10}$/.test(parentPhone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (parentEmail && !/\S+@\S+\.\S+/.test(parentEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Validate date format if provided
      if (dateOfBirth.trim()) {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(dateOfBirth)) {
          Alert.alert('Error', 'Date of Birth must be in YYYY-MM-DD format');
          return;
        }
        const parsedDate = new Date(dateOfBirth);
        if (isNaN(parsedDate.getTime())) {
          Alert.alert('Error', 'Please enter a valid date');
          return;
        }
      }

      const studentData = {
        name: name.trim(),
        standard: standardId,
        rollNumber: rollNumber.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        parentContact: {
          phone: parentPhone || undefined,
          email: parentEmail.trim() || undefined,
        },
      };

      await studentService.createStudent(studentData);
      
      Alert.alert('Success', 'Student added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding student:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add student. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Student</Text>
            <Text style={styles.subtitle}>Fill in the student's information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Student Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter student's full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter roll number (optional)"
                  value={rollNumber}
                  onChangeText={setRollNumber}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (e.g., 2010-05-15) - optional"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parent Contact Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Parent Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  value={parentPhone}
                  onChangeText={setParentPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Parent Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter parent's email address"
                  value={parentEmail}
                  onChangeText={setParentEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add Student</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  formContainer: {
    backgroundColor: '#fff',
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderColor: '#e9ecef',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddStudent;
