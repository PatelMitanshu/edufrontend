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
import { useTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddUpload'>;

function AddUpload({ route, navigation }: Props) {
  const { studentId } = route.params;
  const { theme } = useTheme();
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
          // Document picker cancelled or error occurred
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
      const errorMessage = error.response?.data?.message || 'Failed to add upload. Please try again.';
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
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Add Upload</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Share student's work, videos, or documents</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: theme.colors.surface, shadowColor: theme.isDark ? '#000' : '#000' }]}>
            {/* Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upload Type</Text>
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
                      { 
                        backgroundColor: type === item.key ? theme.colors.primary + '20' : theme.colors.background,
                        borderColor: type === item.key ? theme.colors.primary : theme.colors.border
                      }
                    ]}
                    onPress={() => handleTypeSelect(item.key as any)}
                  >
                    <Text style={styles.typeIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: type === item.key ? theme.colors.primary : theme.colors.textSecondary }
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
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select File</Text>
              <TouchableOpacity 
                style={[
                  styles.fileButton, 
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border
                  }
                ]} 
                onPress={handleFilePick}
              >
                <Text style={[styles.fileButtonText, { color: theme.colors.textSecondary }]}>
                  {file ? file.fileName || file.name || 'File Selected' : 'Choose File'}
                </Text>
              </TouchableOpacity>
              {file && (
                <Text style={[styles.fileInfo, { color: theme.colors.success }]}>
                  {file.fileName || file.name} ({Math.round((file.fileSize || file.size) / 1024)} KB)
                </Text>
              )}
            </View>

            {/* Upload Details */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upload Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Title *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }
                  ]}
                  placeholder="Enter upload title"
                  placeholderTextColor={theme.colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Subject</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }
                  ]}
                  placeholder="Enter subject (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Description</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }
                  ]}
                  placeholder="Enter description (optional)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { backgroundColor: loading ? theme.colors.textMuted : theme.colors.primary },
                loading && styles.buttonDisabled
              ]}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
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
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfo: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddUpload;
