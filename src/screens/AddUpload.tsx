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
import { uploadService } from '../services/uploadService';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import { DocumentPickerResponse, pick, types } from '@react-native-documents/picker';

type Props = NativeStackScreenProps<RootStackParamList, 'AddUpload'>;

function AddUpload({ route, navigation }: Props) {
  const { studentId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'video' | 'document' | 'image'>('document');
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTypeSelect = (selectedType: 'video' | 'document' | 'image') => {
    setType(selectedType);
    setFile(null); // Reset file when type changes
  };

  const handleFilePick = () => {
    if (type === 'image' || type === 'video') {
      const mediaType: MediaType = type === 'image' ? 'photo' : 'video';
      launchImageLibrary(
        {
          mediaType,
          quality: 0.8,
          selectionLimit: 1,
        },
        (response) => {
          if (response.assets && response.assets[0]) {
            setFile(response.assets[0]);
          }
        }
      );
    } else if (type === 'document') {
      pick({
        type: [types.pdf, types.doc, types.docx],
        allowMultiSelection: false,
      })
        .then((result) => {
          if (result && result.length > 0) {
            setFile(result[0]);
          }
        })
        .catch((err) => {
          console.error('Document picker error:', err);
        });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!file) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    // Check file size (50MB limit)
    const fileSizeLimit = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size && file.size > fileSizeLimit) {
      Alert.alert('Error', 'File size must be less than 50MB');
      return;
    }

    try {
      setLoading(true);
      
      const uploadData = {
        title: title.trim(),
        student: studentId,
        type,
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        file,
      };

      await uploadService.createUpload(uploadData);
      
      Alert.alert('Success', 'Upload added successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding upload:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add upload. Please try again.';
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
            <Text style={styles.title}>Add Upload</Text>
            <Text style={styles.subtitle}>Share student's work, videos, or documents</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Type</Text>
              <View style={styles.typeContainer}>
                {[
                  { key: 'document', label: 'Document', icon: '📄' },
                  { key: 'image', label: 'Image', icon: '🖼️' },
                  { key: 'video', label: 'Video', icon: '🎥' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.typeButton,
                      type === item.key && styles.selectedTypeButton,
                    ]}
                    onPress={() => handleTypeSelect(item.key as any)}
                  >
                    <Text style={styles.typeIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        type === item.key && styles.selectedTypeLabel,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* File Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select File</Text>
              <TouchableOpacity style={styles.fileButton} onPress={handleFilePick}>
                <Text style={styles.fileButtonText}>
                  {file ? file.fileName || file.name || 'File Selected' : 'Choose File'}
                </Text>
              </TouchableOpacity>
              {file && (
                <Text style={styles.fileInfo}>
                  {file.fileName || file.name} ({Math.round((file.fileSize || file.size) / 1024)} KB)
                </Text>
              )}
            </View>

            {/* Upload Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter upload title"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter subject (optional)"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
                <Text style={styles.submitButtonText}>Add Upload</Text>
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
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedTypeButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  selectedTypeLabel: {
    color: '#007bff',
  },
  fileButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  fileInfo: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 8,
    textAlign: 'center',
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
    borderColor: '#e9ecef',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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

export default AddUpload;
