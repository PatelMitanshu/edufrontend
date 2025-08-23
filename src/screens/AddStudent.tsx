import React, { useState, useEffect } from 'react';
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
import { divisionService, Division } from '../services/divisionService';
import { useTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStudent'>;

function AddStudent({ route, navigation }: Props) {
  const { standardId, divisionId, divisionName } = route.params;
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [uid, setUid] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Division selection (if not passed from DivisionDetail)
  const [selectedDivisionId, setSelectedDivisionId] = useState(divisionId || '');
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(!divisionId);

  useEffect(() => {
    // If division is already specified (coming from DivisionDetail), don't load divisions
    if (divisionId) {
      setSelectedDivisionId(divisionId);
      return;
    }

    // Load divisions for this standard
    loadDivisions();
  }, [standardId, divisionId]);

  const loadDivisions = async () => {
    try {
      setLoadingDivisions(true);
      const response = await divisionService.getDivisionsByStandard(standardId);
      setDivisions(response.divisions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load divisions');
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    if (!selectedDivisionId) {
      Alert.alert('Error', 'Please select a division');
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
        standardId: standardId,
        divisionId: selectedDivisionId,
        rollNumber: rollNumber.trim() || undefined,
        uid: uid.trim() || undefined,
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
      const errorMessage = error.response?.data?.message || 'Failed to add student. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Add New Student
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {divisionName ? `to ${divisionName}` : 'Fill in the details below'}
            </Text>
          </View>

          {/* Division Selection (only if not pre-selected) */}
          {!divisionId && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Division *
              </Text>
              {loadingDivisions ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Loading divisions...
                  </Text>
                </View>
              ) : divisions.length === 0 ? (
                <View style={[styles.noDivisionsContainer, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.noDivisionsText, { color: theme.colors.textSecondary }]}>
                    No divisions found. Please create a division first.
                  </Text>
                </View>
              ) : (
                <View style={styles.divisionGrid}>
                  {divisions.map((division) => (
                    <TouchableOpacity
                      key={division._id}
                      style={[
                        styles.divisionOption,
                        {
                          backgroundColor: selectedDivisionId === division._id 
                            ? theme.colors.primary 
                            : theme.colors.surface,
                          borderColor: theme.colors.primary,
                        }
                      ]}
                      onPress={() => setSelectedDivisionId(division._id)}
                    >
                      <Text style={[
                        styles.divisionText,
                        {
                          color: selectedDivisionId === division._id 
                            ? theme.colors.surface 
                            : theme.colors.text
                        }
                      ]}>
                        {division.fullName}
                      </Text>
                      <Text style={[
                        styles.divisionCount,
                        {
                          color: selectedDivisionId === division._id 
                            ? theme.colors.surface + '90'
                            : theme.colors.textSecondary
                        }
                      ]}>
                        {division.studentCount} student{division.studentCount !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Student Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Student Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="Enter full name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Roll Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Roll Number (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="Enter roll number"
              placeholderTextColor={theme.colors.textSecondary}
              value={rollNumber}
              onChangeText={setRollNumber}
            />
          </View>

          {/* UID */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              UID (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="Enter UID"
              placeholderTextColor={theme.colors.textSecondary}
              value={uid}
              onChangeText={setUid}
            />
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Date of Birth (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
            />
          </View>

          {/* Parent Contact */}
          <View style={styles.inputGroup}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Parent Contact (Optional)
            </Text>
            
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Phone Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="10-digit phone number"
              placeholderTextColor={theme.colors.textSecondary}
              value={parentPhone}
              onChangeText={setParentPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
            
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.primary + '30',
                }
              ]}
              placeholder="parent@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={parentEmail}
              onChangeText={setParentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: loading ? 0.7 : 1,
              }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <Text style={[styles.submitText, { color: theme.colors.surface }]}>
                Add Student
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  divisionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  divisionOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: '30%',
    alignItems: 'center',
  },
  divisionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  divisionCount: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  noDivisionsContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDivisionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddStudent;
