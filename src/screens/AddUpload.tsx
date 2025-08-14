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
        type: [
          types.pdf, 
          types.doc, 
          types.docx, 
          types.ppt, 
          types.pptx,
          types.xls,
          types.xlsx,
          types.csv,
          types.plainText,
          types.zip,
          // Microsoft Office MIME types
          'application/vnd.ms-excel',
          'application/vnd.ms-powerpoint',
          'application/vnd.ms-word',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Open Document formats
          'application/vnd.oasis.opendocument.text',
          'application/vnd.oasis.opendocument.spreadsheet',
          'application/vnd.oasis.opendocument.presentation',
          // Other formats
          'application/rtf',
          'application/json',
          'application/xml',
          'text/xml',
          'text/csv',
          // Additional spreadsheet formats
          'application/x-excel',
          'application/x-msexcel',
          // Allow all files as fallback
          types.allFiles,
        ],
        allowMultiSelection: false,
        copyTo: 'documentDirectory', // This helps with accessing the file
        mode: 'open', // Ensure we can open the files
      })
        .then((result) => {
          if (result && result.length > 0) {
            const file = result[0];
                                                            // Special handling for files without proper MIME types
            if (!file.type || file.type === 'application/octet-stream') {
              const extension = file.name?.split('.').pop()?.toLowerCase();
                            // Guess MIME type from extension
              let guessedType = file.type;
              if (extension === 'xlsx') guessedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              else if (extension === 'xls') guessedType = 'application/vnd.ms-excel';
              else if (extension === 'docx') guessedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              else if (extension === 'doc') guessedType = 'application/vnd.ms-word';
              else if (extension === 'pptx') guessedType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
              else if (extension === 'ppt') guessedType = 'application/vnd.ms-powerpoint';
              else if (extension === 'pdf') guessedType = 'application/pdf';
              else if (extension === 'csv') guessedType = 'text/csv';
              
              if (guessedType !== file.type) {
                                setFile({ ...file, type: guessedType });
              } else {
                setFile(file);
              }
            } else {
              setFile(file);
            }
          }
        })
        .catch((err) => {
          if (err.message !== 'User canceled document picker') {
                        Alert.alert('Error', 'Failed to pick document. Please try again.');
          }
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

    // Special handling for Google Sheets/Docs URLs
    if (file.uri && (file.uri.includes('docs.google.com') || file.uri.includes('drive.google.com'))) {
      Alert.alert(
        'Google Files Notice',
        'Google Sheets and Docs need to be downloaded first and then uploaded. Please:\n\n1. Open the Google file\n2. Go to File > Download\n3. Choose a format (Excel, PDF, etc.)\n4. Upload the downloaded file',
        [
          { text: 'OK', style: 'default' }
        ]
      );
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
              
              {/* Supported formats info */}
              {type === 'document' && (
                <View style={[styles.supportedFormats, { backgroundColor: theme.colors.primary + '10', marginTop: 8 }]}>
                  <Text style={[styles.supportedFormatsTitle, { color: theme.colors.primary }]}>📋 Supported Document Types:</Text>
                  <Text style={[styles.supportedFormatsText, { color: theme.colors.textSecondary }]}>
                    PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), 
                    CSV, Text files, RTF, OpenDocument formats, ZIP archives, JSON, XML
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.supportedFormatsTitle, { color: '#ff9500', fontSize: 12 }]}>⚠️ For Google Files:</Text>
                    <Text style={[styles.supportedFormatsText, { color: theme.colors.textSecondary, fontSize: 11 }]}>
                      Google Sheets/Docs must be downloaded first (File → Download → Excel/Word/PDF) then uploaded
                    </Text>
                  </View>
                </View>
              )}
              {type === 'image' && (
                <View style={[styles.supportedFormats, { backgroundColor: theme.colors.primary + '10', marginTop: 8 }]}>
                  <Text style={[styles.supportedFormatsTitle, { color: theme.colors.primary }]}>🖼️ Supported Image Types:</Text>
                  <Text style={[styles.supportedFormatsText, { color: theme.colors.textSecondary }]}>
                    JPEG, JPG, PNG, GIF, WebP
                  </Text>
                </View>
              )}
              {type === 'video' && (
                <View style={[styles.supportedFormats, { backgroundColor: theme.colors.primary + '10', marginTop: 8 }]}>
                  <Text style={[styles.supportedFormatsTitle, { color: theme.colors.primary }]}>🎥 Supported Video Types:</Text>
                  <Text style={[styles.supportedFormatsText, { color: theme.colors.textSecondary }]}>
                    MP4, AVI, MOV, QuickTime, WebM
                  </Text>
                </View>
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
  supportedFormats: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  supportedFormatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportedFormatsText: {
    fontSize: 12,
    lineHeight: 16,
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
