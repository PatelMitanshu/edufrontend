import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pick, types, DocumentPickerResponse } from '@react-native-documents/picker';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import { tw } from '../utils/tailwind';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SafeText } from '../components/SafeText';
import { useTheme } from '../contexts/ThemeContext';
import { LessonPlan, lessonPlanService } from '../services/lessonPlanService';
import { uploadService } from '../services/uploadService';
import { API_URL } from '../services/api';

interface AddLessonPlanProps {
  visible: boolean;
  onClose: () => void;
  onSave: (lessonPlan: Omit<LessonPlan, 'id'>) => void;
  editingPlan?: LessonPlan | null;
}

const AddLessonPlan: React.FC<AddLessonPlanProps> = ({
  visible,
  onClose,
  onSave,
  editingPlan,
}) => {
  const { theme } = useTheme();
  
  // All state with safe default values
  const [subject, setSubject] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [startTime, setStartTime] = useState<string>('10:00');
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>('60');
  const [materials, setMaterials] = useState<LessonPlan['materials']>([]);
  
  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [savingLessonPlan, setSavingLessonPlan] = useState<boolean>(false);
  
  // Store pending file uploads
  const [pendingFileUploads, setPendingFileUploads] = useState<Array<{
    file: any;
    fileType: 'image' | 'video' | 'document';
    title: string;
    tempId: string;
  }>>([]);
  
  const [newMaterial, setNewMaterial] = useState<{
    type: 'photo' | 'video' | 'text' | 'link' | 'document';
    title: string;
    content: string;
  }>({
    type: 'text',
    title: '',
    content: '',
  });

  // Helper: safe date formatting
  const formatDateDisplay = (d: Date): string => {
    try {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {return '01/01/2025';
    }
  };

  // Helper: safe material type label
  const getTypeLabel = (type: string): string => {
    const typeStr = String(type || 'text');
    switch (typeStr) {
      case 'text': return '📝 Text';
      case 'photo': return '📷 Photo';
      case 'video': return '🎥 Video';
      case 'document': return '📄 Document';
      case 'link': return '🔗 Link';
      default: return '📄 Document';
    }
  };

  // Helper: safe text converter
  const safeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const resetForm = () => {
    setSubject('');
    setTopic('');
    setDescription('');
    const now = new Date();
    setDateObj(now);
    setDate(formatDateDisplay(now));
    setStartTime('10:00');
    setDuration('60');
    setMaterials([]);
    setPendingFileUploads([]);
  };

  // Date picker handlers
  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      setDate(formatDateDisplay(selectedDate));
    }
  };

  const onChangeTime = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, '0');
      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  };

  // Handle form hydration when editing
  useEffect(() => {
    if (!visible) return;

  if (editingPlan) {
      
      setSubject(safeString(editingPlan.subject));
      setTopic(safeString(editingPlan.topic));
      setDescription(safeString(editingPlan.description));
      
      const parsedDate = editingPlan.date ? new Date(editingPlan.date) : new Date();
      setDateObj(parsedDate);
      setDate(formatDateDisplay(parsedDate));
      setStartTime(safeString(editingPlan.startTime) || '10:00');
      setDuration(safeString(editingPlan.duration) || '60');
      
      // Sanitize materials
      const safeMaterials = Array.isArray(editingPlan.materials) 
        ? editingPlan.materials.map(material => ({
            type: material.type as 'photo' | 'video' | 'document' | 'text' | 'link',
            title: safeString(material.title),
            content: safeString(material.content),
          }))
        : [];
      setMaterials(safeMaterials);
    } else {
      resetForm();
    }

    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
  }, [editingPlan, visible]);

  const handleSave = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter the subject.');
      return;
    }

    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter the topic.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }

    if (!duration.trim()) {
      Alert.alert('Error', 'Please specify the duration.');
      return;
    }

    // Validate date format dd/mm/yyyy
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      Alert.alert('Error', 'Please select a valid date.');
      return;
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2030) {
      Alert.alert('Error', 'Please enter a valid date.');
      return;
    }
    
    const isoDate = new Date(year, month, day);
    if (isNaN(isoDate.getTime())) {
      Alert.alert('Error', 'Please select a valid date.');
      return;
    }

    // Validate time
    const timeMatch = startTime.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) {
      Alert.alert('Error', 'Please select a valid time.');
      return;
    }

    // Validate duration
    const durationNum = parseInt(duration.trim(), 10);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 600) {
      Alert.alert('Error', 'Please enter a valid duration between 1-600 minutes.');
      return;
    }

    setSavingLessonPlan(true);

    try {
      // Upload pending files sequentially using the lesson-plan material upload endpoint
      const tempIdToUrl: Record<string, string> = {};
      if (pendingFileUploads.length > 0) {
        for (const pending of pendingFileUploads) {
          try {
            // Get auth token
            const token = await AsyncStorage.getItem('authToken');
            
            // Create FormData for lesson plan material upload
            const formData = new FormData();
            formData.append('title', pending.title || 'Material file');
            formData.append('type', pending.fileType);
            formData.append('description', `Lesson plan material for ${subject.trim()}`);
            
            const fileData = {
              uri: pending.file.uri,
              type: pending.file.type,
              name: pending.file.name,
            };
            
            formData.append('file', fileData as any);

            // Use the lesson plan material upload endpoint
            const response = await fetch(`${API_URL}/lesson-plans/upload-material`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData - let fetch set it with boundary
              },
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `Upload failed with status ${response.status}`);
            }

            const result = await response.json();
            const uploadedUrl = result?.data?.url || '';
            tempIdToUrl[pending.tempId] = uploadedUrl;
          } catch (uploadErr: any) {Alert.alert('Upload failed', `Failed to upload ${pending.title}: ${uploadErr?.message || uploadErr}`);
            setSavingLessonPlan(false);
            return;
          }
        }
      }

      // Replace pending tokens in materials
      const finalMaterials = (materials || []).map((m: any) => {
        if (!m || typeof m !== 'object') return m;
        const content = safeString(m.content || '');
        if (content.startsWith('__pending:')) {
          const tempId = content.split(':')[1];
          return { ...m, content: tempIdToUrl[tempId] || '' };
        }
        return { ...m, content };
      });

      const lessonPlan: Omit<LessonPlan, 'id' | '_id'> = {
        subject: subject.trim(),
        topic: topic.trim(),
        description: description.trim(),
        date: isoDate.toISOString(),
        startTime,
        duration: durationNum,
        materials: finalMaterials,
        completed: editingPlan?.completed || false,
      };

      // Clear pending uploads after successful upload and save
      setPendingFileUploads([]);

      onSave(lessonPlan);
      resetForm();
      onClose();

    } catch (error) {Alert.alert('Error', `Failed to save lesson plan: ${error}`);
    } finally {
      setSavingLessonPlan(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setShowMaterialModal(false);
    setNewMaterial({ type: 'text', title: '', content: '' });
    onClose();
  };

  // Helper: generate a temporary id for pending file placeholders
  const makeTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Pick file appropriate for the material type and store it in pendingFileUploads.
  const pickFileForMaterial = async (type: 'text' | 'photo' | 'video' | 'document' | 'link') => {
    try {
      if (type === 'photo' || type === 'video') {
        const mediaType: any = type === 'photo' ? 'photo' : 'video';
        const result = await launchImageLibrary({ mediaType });
        if (result && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const tempId = makeTempId();
          const fileObj = {
            uri: asset.uri,
            name: asset.fileName || `file_${tempId}`,
            type: asset.type || (type === 'photo' ? 'image/jpeg' : 'video/mp4'),
            size: asset.fileSize,
          };

          setNewMaterial(prev => ({ ...prev, content: `__pending:${tempId}`, title: prev.title || fileObj.name }));
          setPendingFileUploads(prev => [...prev, { file: fileObj, fileType: type === 'photo' ? 'image' : 'video', title: fileObj.name, tempId }]);
        }
      } else if (type === 'document') {
  // pick may return a single object or an array depending on configuration
  const resList = await pick({ type: [types.allFiles] as any });
        const res = Array.isArray(resList) ? resList[0] : resList;
        if (res && (res as any).uri) {
          const tempId = makeTempId();
          const fileObj = {
            uri: (res as any).uri,
            name: (res as any).name || `file_${tempId}`,
            type: (res as any).type || 'application/octet-stream',
            size: (res as any).size,
          };

          setNewMaterial(prev => ({ ...prev, content: `__pending:${tempId}`, title: prev.title || fileObj.name }));
          setPendingFileUploads(prev => [...prev, { file: fileObj, fileType: 'document', title: fileObj.name, tempId }]);
        }
      } else {
        // link or text types: allow attaching a document explicitly
  const resList = await pick({ type: [types.allFiles] as any });
        const res = Array.isArray(resList) ? resList[0] : resList;
        if (res && (res as any).uri) {
          const tempId = makeTempId();
          const fileObj = {
            uri: (res as any).uri,
            name: (res as any).name || `file_${tempId}`,
            type: (res as any).type || 'application/octet-stream',
            size: (res as any).size,
          };
          setNewMaterial(prev => ({ ...prev, content: `__pending:${tempId}`, title: prev.title || fileObj.name }));
          setPendingFileUploads(prev => [...prev, { file: fileObj, fileType: 'document', title: fileObj.name, tempId }]);
        }
      }
    } catch (err: any) {
      // On cancellation some implementations throw an object with code
      if (err && (err.code === 'DOCUMENT_PICKER_CANCELED' || err.code === 'E_PICKER_CANCELLED')) {
        return;
      }Alert.alert('File selection error', String(err?.message || err));
    }
  };

  const addMaterial = () => {
    if (!newMaterial.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the material.');
      return;
    }

    // For text require content; for link require a valid URL (attaching files is not allowed for links)
    if (newMaterial.type === 'text' && !newMaterial.content.trim()) {
      Alert.alert('Error', 'Please enter content for the material.');
      return;
    }
    if (newMaterial.type === 'link') {
      const url = newMaterial.content.trim();
      if (!url) {
        Alert.alert('Error', 'Please enter a URL for the link.');
        return;
      }
      // Simple URL validation (require http/https)
      const isUrl = /^(https?:\/\/)/i.test(url);
      if (!isUrl) {
        Alert.alert('Error', 'Please enter a valid URL starting with http:// or https://');
        return;
      }
    }

    // Add material; content may be a pending token like __pending:<tempId>
    setMaterials(prev => ([...prev, { ...newMaterial }]));
    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
  };

  const removeMaterial = (index: number) => {
    Alert.alert(
      'Remove Material',
      'Are you sure you want to remove this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setMaterials(materials.filter((_, i) => i !== index))
        }
      ]
    );
  };

  const renderMaterial = (material: any, index: number) => {
    if (!material || typeof material !== 'object') return null;

    const getIcon = (): string => {
      switch (material.type) {
        case 'photo': return '📷';
        case 'video': return '🎥';
        case 'text': return '📝';
        case 'link': return '🔗';
        case 'document': return '📄';
        default: return '📄';
      }
    };

    const getContentDisplay = (): string => {
      const content = safeString(material.content);
      if (content.startsWith('http')) {
        return 'Uploaded file (click to view)';
      }
      return content;
    };

    return (
      <View
        key={`material-${index}`}
        style={[
          tw['bg-white'],
          tw['border'],
          tw['border-gray-200'],
          tw['rounded-xl'],
          tw['p-3'],
          tw['mb-2'],
          tw['flex-row'],
          tw['items-center'],
          tw['justify-between'],
        ]}
      >
        <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
          <SafeText style={[tw['text-lg'], tw['mr-3']]} context="material-icon">
            {getIcon()}
          </SafeText>
          <View style={[tw['flex-1']]}>
            <SafeText 
              style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800']]} 
              context="material-title"
            >
              {safeString(material.title)}
            </SafeText>
            <SafeText 
              style={[tw['text-xs'], tw['text-gray-600'], { lineHeight: 16 }]} 
              numberOfLines={2}
              context="material-content"
            >
              {getContentDisplay()}
            </SafeText>
          </View>
        </View>
        <TouchableOpacity
          style={[tw['w-8'], tw['h-8'], tw['rounded-full'], tw['bg-red-500'], tw['items-center'], tw['justify-center']]}
          onPress={() => removeMaterial(index)}
        >
          <SafeText style={[tw['text-sm'], tw['text-white']]} context="remove-x">
            {'×'}
          </SafeText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ErrorBoundary
        onError={(error, errorInfo) => {}}
        fallback={
          <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}> 
            <View style={[tw['p-4'], { backgroundColor: '#fef2f2', borderRadius: 8 }]}>
              <SafeText style={{ color: '#dc2626' }} context="fallback-error">
                {'Error rendering lesson plan form'}
              </SafeText>
            </View>
          </SafeAreaView>
        }
      >
        <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
          />
          
          {/* Header */}
          <View style={[tw['bg-white'], tw['px-5'], tw['py-4'], tw['shadow-lg'], tw['border-b'], tw['border-gray-200']]}>
            <View style={[tw['flex-row'], tw['justify-between'], tw['items-center']]}>
              <TouchableOpacity onPress={handleClose}>
                <SafeText 
                  style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]} 
                  context="header-cancel"
                >
                  {'Cancel'}
                </SafeText>
              </TouchableOpacity>
              <SafeText 
                style={[tw['text-xl'], tw['font-bold'], tw['text-gray-800']]} 
                context="modal-title"
              >
                {editingPlan ? 'Edit Lesson Plan' : 'Add Lesson Plan'}
              </SafeText>
              <TouchableOpacity 
                onPress={handleSave}
                disabled={savingLessonPlan}
                style={[
                  tw['flex-row'],
                  tw['items-center'],
                  savingLessonPlan && tw['opacity-50']
                ]}
              >
                {savingLessonPlan && (
                  <ActivityIndicator 
                    size="small" 
                    color="#2563eb" 
                    style={[tw['mr-2']]} 
                  />
                )}
                <SafeText 
                  style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]} 
                  context="save-button"
                >
                  {savingLessonPlan ? 'Saving...' : 'Save'}
                </SafeText>
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView
            style={[tw['flex-1']]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView style={[tw['flex-1'], tw['px-5'], tw['py-4']]} showsVerticalScrollIndicator={false}>
              
              {/* Subject */}
              <View style={[tw['mb-4']]}>
                <SafeText 
                  style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="label-subject"
                >
                  {'Subject *'}
                </SafeText>
                <TextInput
                  style={[
                    tw['bg-white'],
                    tw['border'],
                    tw['border-gray-200'],
                    tw['rounded-xl'],
                    tw['px-4'],
                    tw['py-3'],
                    tw['text-base'],
                    tw['text-gray-800'],
                  ]}
                  placeholder="e.g., Mathematics, Science, English"
                  placeholderTextColor="#9CA3AF"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              {/* Topic */}
              <View style={[tw['mb-4']]}>
                <SafeText 
                  style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="label-topic"
                >
                  {'Topic *'}
                </SafeText>
                <TextInput
                  style={[
                    tw['bg-white'],
                    tw['border'],
                    tw['border-gray-200'],
                    tw['rounded-xl'],
                    tw['px-4'],
                    tw['py-3'],
                    tw['text-base'],
                    tw['text-gray-800'],
                  ]}
                  placeholder="e.g., Algebra Basics, Plant Cell Structure"
                  placeholderTextColor="#9CA3AF"
                  value={topic}
                  onChangeText={setTopic}
                />
              </View>

              {/* Date and Time */}
              <View style={[tw['flex-row'], tw['mb-4']]}>
                <View style={[tw['flex-1'], tw['mr-2']]}>
                  <SafeText 
                    style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                    context="label-date"
                  >
                    {'Date *'}
                  </SafeText>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <View style={[
                      tw['bg-white'],
                      tw['border'],
                      tw['border-gray-200'],
                      tw['rounded-xl'],
                      tw['px-4'],
                      tw['py-3'],
                      tw['flex-row'],
                      tw['items-center'],
                      tw['justify-between'],
                    ]}>
                      <SafeText 
                        style={[tw['text-base'], tw['text-gray-800']]} 
                        context="date-field"
                      >
                        {date}
                      </SafeText>
                      <SafeText 
                        style={[tw['text-lg']]} 
                        context="icon-calendar"
                      >
                        {'📅'}
                      </SafeText>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={[tw['flex-1'], tw['ml-2']]}>
                  <SafeText 
                    style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                    context="label-time"
                  >
                    {'Time *'}
                  </SafeText>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                    <View style={[
                      tw['bg-white'],
                      tw['border'],
                      tw['border-gray-200'],
                      tw['rounded-xl'],
                      tw['px-4'],
                      tw['py-3'],
                      tw['flex-row'],
                      tw['items-center'],
                      tw['justify-between'],
                    ]}>
                      <SafeText 
                        style={[tw['text-base'], tw['text-gray-800']]} 
                        context="time-field"
                      >
                        {startTime}
                      </SafeText>
                      <SafeText 
                        style={[tw['text-lg']]} 
                        context="icon-clock"
                      >
                        {'🕐'}
                      </SafeText>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={onChangeDate}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeTime}
                />
              )}

              {/* Duration */}
              <View style={[tw['mb-4']]}>
                <SafeText 
                  style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="label-duration"
                >
                  {'Duration (minutes) *'}
                </SafeText>
                <TextInput
                  style={[
                    tw['bg-white'],
                    tw['border'],
                    tw['border-gray-200'],
                    tw['rounded-xl'],
                    tw['px-4'],
                    tw['py-3'],
                    tw['text-base'],
                    tw['text-gray-800'],
                  ]}
                  placeholder="e.g., 45 or 60"
                  placeholderTextColor="#9CA3AF"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              {/* Description */}
              <View style={[tw['mb-4']]}>
                <SafeText 
                  style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="label-description"
                >
                  {'Description *'}
                </SafeText>
                <TextInput
                  style={[
                    tw['bg-white'],
                    tw['border'],
                    tw['border-gray-200'],
                    tw['rounded-xl'],
                    tw['px-4'],
                    tw['py-3'],
                    tw['text-base'],
                    tw['text-gray-800'],
                    tw['h-20'],
                  ]}
                  placeholder="Lesson objectives, activities, notes..."
                  placeholderTextColor="#9CA3AF"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Materials Section */}
              <View style={[tw['mb-6']]}>
                <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['mb-3']]}>
                  <SafeText 
                    style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800']]} 
                    context="materials-header"
                  >
                    {'Teaching Materials'}
                  </SafeText>
                  <TouchableOpacity
                    style={[
                      tw['bg-blue-600'],
                      tw['px-3'],
                      tw['py-2'],
                      tw['rounded-xl'],
                    ]}
                    onPress={() => setShowMaterialModal(true)}
                  >
                    <SafeText 
                      style={[tw['text-sm'], tw['text-white'], tw['font-semibold']]} 
                      context="add-material-btn"
                    >
                      {'➕ Add Material'}
                    </SafeText>
                  </TouchableOpacity>
                </View>

                <ErrorBoundary
                  onError={(error, errorInfo) => {}}
                  fallback={
                    <View style={[tw['p-4'], { backgroundColor: '#fef2f2', borderRadius: 8 }]}>
                      <SafeText 
                        style={[{ color: '#dc2626' }]} 
                        context="materials-fallback"
                      >
                        {'Error rendering materials'}
                      </SafeText>
                    </View>
                  }
                >
                  {materials && Array.isArray(materials) ? 
                    materials.map((material, index) => renderMaterial(material, index)).filter(Boolean) 
                    : null
                  }
                </ErrorBoundary>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Material Modal */}
          <Modal visible={showMaterialModal} transparent animationType="slide">
            <View style={[tw['flex-1'], { backgroundColor: 'rgba(0,0,0,0.5)' }, tw['items-center'], tw['justify-center']]}>
              <View style={[tw['bg-white'], tw['rounded-xl'], tw['p-5'], tw['w-80'], tw['mx-4']]}>
                <SafeText 
                  style={[tw['text-lg'], tw['font-bold'], tw['text-gray-800'], tw['mb-4'], tw['text-center']]} 
                  context="material-modal-title"
                >
                  {'Add Teaching Material'}
                </SafeText>

                {/* Material Type Selector */}
                <SafeText 
                  style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="material-type-label"
                >
                  {'Type'}
                </SafeText>
                <View style={[tw['flex-row'], tw['flex-wrap'], tw['mb-4']]}>
                  {(['text', 'photo', 'video', 'document', 'link'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        tw['px-4'],
                        tw['py-2'],
                        tw['rounded-xl'],
                        tw['mr-2'],
                        tw['mb-2'],
                        tw['border'],
                        newMaterial.type === type
                          ? [tw['bg-blue-600'], tw['border-blue-500']]
                          : [tw['bg-white'], tw['border-gray-200']],
                      ]}
                      onPress={() => setNewMaterial({ ...newMaterial, type })}
                    >
                      <SafeText
                        style={[
                          tw['text-sm'],
                          tw['font-medium'],
                          tw['capitalize'],
                          newMaterial.type === type ? tw['text-white'] : tw['text-gray-800'],
                        ]}
                        context="material-type-button"
                      >
                        {getTypeLabel(type)}
                      </SafeText>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Title */}
                <SafeText 
                  style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                  context="material-title-label"
                >
                  {'Title'}
                </SafeText>
                <TextInput
                  style={[
                    tw['bg-gray-50'],
                    tw['border'],
                    tw['border-gray-200'],
                    tw['rounded-xl'],
                    tw['px-4'],
                    tw['py-3'],
                    tw['text-base'],
                    tw['text-gray-800'],
                    tw['mb-4'],
                  ]}
                  placeholder="Material title"
                  placeholderTextColor="#9CA3AF"
                  value={newMaterial.title}
                  onChangeText={(text) => setNewMaterial({ ...newMaterial, title: text })}
                />

                {/* Content Section */}
                {(newMaterial.type === 'text' || newMaterial.type === 'link') && (
                  <>
                    <SafeText 
                      style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} 
                      context="material-content-label"
                    >
                      {newMaterial.type === 'link' ? 'URL' : 'Content'}
                    </SafeText>
                    <TextInput
                      style={[
                        tw['bg-gray-50'],
                        tw['border'],
                        tw['border-gray-200'],
                        tw['rounded-xl'],
                        tw['px-4'],
                        tw['py-3'],
                        tw['text-base'],
                        tw['text-gray-800'],
                        tw['mb-4'],
                        newMaterial.type === 'text' && tw['h-20'],
                      ]}
                      placeholder={
                        newMaterial.type === 'link'
                          ? 'https://example.com'
                          : 'Material content...'
                      }
                      placeholderTextColor="#9CA3AF"
                      value={newMaterial.content}
                      onChangeText={(text) => setNewMaterial({ ...newMaterial, content: text })}
                      multiline={newMaterial.type === 'text'}
                      textAlignVertical={newMaterial.type === 'text' ? 'top' : 'center'}
                    />
                  </>
                )}

                {/* Attach File Button & selected filename preview (not available for text or link types) */}
                {newMaterial.type !== 'text' && newMaterial.type !== 'link' && (
                  <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
                    <TouchableOpacity
                      style={[tw['px-3'], tw['py-2'], tw['rounded-xl'], tw['bg-gray-100'], tw['mr-3']]}
                      onPress={() => pickFileForMaterial(newMaterial.type)}
                    >
                      <SafeText context="attach-file-btn">{'📎 Attach file'}</SafeText>
                    </TouchableOpacity>
                    <View style={[tw['flex-1']]}> 
                      {newMaterial.content && newMaterial.content.startsWith('__pending:') ? (
                        <SafeText context="attached-filename" style={tw['text-sm']}>{
                          // Find display name for this pending token
                          (() => {
                            const tempId = newMaterial.content.split(':')[1];
                            const p = pendingFileUploads.find(p => p.tempId === tempId);
                            return p ? p.title : 'Selected file';
                          })()
                        }</SafeText>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Buttons */}
                <View style={[tw['flex-row'], tw['justify-between']]}>
                  <TouchableOpacity
                    style={[tw['px-4'], tw['py-2'], tw['flex-1'], tw['mr-2']]}
                    onPress={() => {
                      setNewMaterial({ type: 'text', title: '', content: '' });
                      setShowMaterialModal(false);
                    }}
                  >
                    <SafeText 
                      style={[tw['text-base'], tw['text-gray-600'], tw['text-center']]} 
                      context="material-modal-cancel"
                    >
                      {'Cancel'}
                    </SafeText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      tw['bg-blue-600'], 
                      tw['px-4'], 
                      tw['py-2'], 
                      tw['rounded-xl'], 
                      tw['flex-1'], 
                      tw['ml-2'],
                    ]}
                    onPress={addMaterial}
                  >
                    <SafeText 
                      style={[tw['text-base'], tw['text-white'], tw['font-semibold'], tw['text-center']]} 
                      context="material-modal-add"
                    >
                      {'Add'}
                    </SafeText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </ErrorBoundary>
    </Modal>
  );
};

export default AddLessonPlan;
