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
  // Debug proxy for Text to log children types during render
  const Text: any = (props: any) => {
    try {
      const children = props.children;
      const type = Array.isArray(children) ? 'array' : typeof children;
      const preview = (() => {
        try {
          if (children === null) return 'null';
          if (children === undefined) return 'undefined';
          if (typeof children === 'string') return children.length > 80 ? children.slice(0, 80) + '…' : children;
          if (typeof children === 'number' || typeof children === 'boolean') return String(children);
          if (Array.isArray(children)) return `Array(${children.length})`;
          if (typeof children === 'object') return JSON.stringify(children).slice(0, 120);
          return String(children);
        } catch (e) {
          return '[preview-failed]';
        }
      })();

      console.log(`DebugText render — type=${type} preview=${preview}`, { style: props.style });

      if (type === 'array' || type === 'object') {
        console.error('DebugText: Problematic children for Text detected:', { type, preview });
        console.trace('DebugText stack trace for problematic Text:');
      }
    } catch (e) {
      console.error('DebugText: error inspecting children', e);
    }
    return <RNText {...props}>{props.children}</RNText>;
  };
  
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [startTime, setStartTime] = useState('10:00');
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState('60');
  const [materials, setMaterials] = useState<LessonPlan['materials']>([]);
  
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingLessonPlan, setSavingLessonPlan] = useState(false);
  
  // Store pending file uploads (files selected but not yet uploaded)
  const [pendingFileUploads, setPendingFileUploads] = useState<Array<{
    file: any;
    fileType: 'image' | 'video' | 'document';
    title: string;
    tempId: string;
  }>>([]);
  
  const [newMaterial, setNewMaterial] = useState({
    type: 'text' as 'photo' | 'video' | 'text' | 'link' | 'document',
    title: '',
    content: '',
  });

  // Hydrate form when opening for edit, or reset when opening for add
  useEffect(() => {
    if (!visible) return; // only act when modal is shown

    if (editingPlan) {
      console.log('Setting form from editingPlan:', editingPlan);
      
      // Debug: Check types of all fields being set
      console.log('Field types before conversion:', {
        subject: typeof editingPlan.subject,
        topic: typeof editingPlan.topic,
        date: typeof editingPlan.date,
        startTime: typeof editingPlan.startTime,
        duration: typeof editingPlan.duration,
        description: typeof editingPlan.description,
        materials: typeof editingPlan.materials
      });
      
      const subjectStr = String(editingPlan.subject || '');
      const topicStr = String(editingPlan.topic || '');
      const descriptionStr = String(editingPlan.description || '');
      
      console.log('Converted strings:', {
        subject: typeof subjectStr,
        topic: typeof topicStr,
        description: typeof descriptionStr
      });
      
      setSubject(subjectStr);
      setTopic(topicStr);
      setDescription(descriptionStr);
      const parsedDate = editingPlan.date ? new Date(editingPlan.date) : new Date();
      setDateObj(parsedDate);
      setDate(formatDateDisplay(parsedDate));
      setStartTime(String(editingPlan.startTime || '10:00'));
      setDuration(editingPlan.duration != null ? String(editingPlan.duration) : '60');
      
      // Ensure materials is an array and sanitize each material object
      const safeMaterials = Array.isArray(editingPlan.materials) 
        ? editingPlan.materials.map(material => {
            const materialType = material.type as 'photo' | 'video' | 'document' | 'text' | 'link';
            return {
              type: ['photo', 'video', 'document', 'text', 'link'].includes(materialType) ? materialType : 'text',
              title: String(material.title || ''),
              content: String(material.content || ''),
              // Exclude _id and other MongoDB fields that might cause issues
            };
          })
        : [];
      console.log('Setting materials:', safeMaterials);
      setMaterials(safeMaterials);
    } else {
      // fresh add
      resetForm();
    }

    // always start material composer clean
    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
  }, [editingPlan, visible]);  const resetForm = () => {
    setSubject('');
    setTopic('');
    setDescription('');
    const now = new Date();
    setDateObj(now);
    setDate(formatDateDisplay(now));
    setStartTime('10:00');
    setDuration('60');
    setMaterials([]);
    setPendingFileUploads([]); // Clear pending file uploads
  };

  // Helper: safe label for material types (returns a string)
  const getTypeLabel = (t: string): string => {
    const emoji = (() => {
      switch (t) {
        case 'text': return '📝';
        case 'photo': return '📷';
        case 'video': return '🎥';
        case 'document': return '📄';
        case 'link': return '🔗';
        default: return '📄';
      }
    })();
    
    const result = `${emoji} ${String(t || '')}`;
    console.log('getTypeLabel result:', typeof result, result);
    return result;
  };

  // Debug helper to catch non-string values
  const safeText = (value: any, context: string = 'unknown'): string => {
    // Check for arrays which are commonly problematic
    if (Array.isArray(value)) {
      console.error(`ARRAY passed to Text component (${context}):`, value);
      console.trace('Stack trace for array value');
      return value.length > 0 ? value.join(', ') : '[empty array]';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    
    console.error(`Non-string value in Text component (${context}):`, typeof value, value);
    console.trace('Stack trace for non-string value');
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(value || '');
  };

  const formatDateDisplay = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`; // dd/mm/yyyy
  };

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

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openImageLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleVideoPicker = () => {
    Alert.alert(
      'Select Video',
      'Choose how you want to select a video',
      [
        { text: 'Camera', onPress: () => openVideoCamera() },
        { text: 'Gallery', onPress: () => openVideoLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        addFileToQueue(response.assets[0], 'image');
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        addFileToQueue(response.assets[0], 'image');
      }
    });
  };

  const openVideoCamera = () => {
    const options = {
      mediaType: 'video' as MediaType,
      videoQuality: 'medium' as const,
      durationLimit: 300, // 5 minutes
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        addFileToQueue(response.assets[0], 'video');
      }
    });
  };

  const openVideoLibrary = () => {
    const options = {
      mediaType: 'video' as MediaType,
      videoQuality: 'medium' as const,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        addFileToQueue(response.assets[0], 'video');
      }
    });
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await pick({
        type: [
          types.pdf,
          types.doc,
          types.docx,
          types.xls,
          types.xlsx,
          types.ppt,
          types.pptx,
          types.plainText,
          types.csv,
          // Microsoft Office MIME types
          'application/vnd.ms-excel',
          'application/vnd.ms-powerpoint',
          'application/vnd.ms-word',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Other formats
          'application/rtf',
          types.allFiles, // Fallback to allow all files
        ],
        allowMultiSelection: false,
        copyTo: 'documentDirectory',
        mode: 'open',
      });

      if (result && result.length > 0) {
        const file = result[0];
        
        // Handle files without proper MIME types
        if (!file.type || file.type === 'application/octet-stream') {
          const extension = file.name?.split('.').pop()?.toLowerCase();
          let guessedType = file.type;
          
          if (extension === 'xlsx') guessedType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          else if (extension === 'xls') guessedType = 'application/vnd.ms-excel';
          else if (extension === 'docx') guessedType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (extension === 'doc') guessedType = 'application/vnd.ms-word';
          else if (extension === 'pptx') guessedType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          else if (extension === 'ppt') guessedType = 'application/vnd.ms-powerpoint';
          else if (extension === 'pdf') guessedType = 'application/pdf';
          else if (extension === 'csv') guessedType = 'text/csv';
          else if (extension === 'txt') guessedType = 'text/plain';
          
          const fileWithCorrectType = guessedType !== file.type ? { ...file, type: guessedType } : file;
          addFileToQueue(fileWithCorrectType, 'document');
        } else {
          addFileToQueue(file, 'document');
        }
      }
    } catch (error: any) {
      console.error('Document picker error details:', error);
      
      if (error.message !== 'User canceled document picker' && !error.message?.includes('cancel')) {
        // Provide more specific error messages
        let errorMessage = 'Failed to pick document. Please try again.';
        
        if (error.message?.toLowerCase().includes('permission')) {
          errorMessage = 'Permission denied. Please allow file access in device settings and try again.';
        } else if (error.message?.toLowerCase().includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.toLowerCase().includes('storage')) {
          errorMessage = 'Storage access error. Please check device storage and try again.';
        } else if (error.code === 'DOCUMENT_PICKER_CANCELED') {
          // User canceled, don't show error
          return;
        }
        
        Alert.alert('Document Picker Error', errorMessage + '\n\nError details: ' + error.message);
      }
    }
  };

  const addFileToQueue = (file: any, fileType: 'image' | 'video' | 'document') => {
    if (!newMaterial.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the material first.');
      return;
    }

    // Generate a temporary ID for the file
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to pending uploads queue
    const newPendingUpload = {
      file,
      fileType,
      title: newMaterial.title,
      tempId
    };
    
    setPendingFileUploads([...pendingFileUploads, newPendingUpload]);
    
    // Add a temporary material to the UI with temp ID as content
    const materialType = fileType === 'image' ? 'photo' : fileType === 'video' ? 'video' : 'document';
    const tempMaterial = {
      type: materialType as 'photo' | 'video' | 'document',
      title: newMaterial.title,
      content: tempId, // Temporary content, will be replaced with actual URL after upload
    };
    
    setMaterials([...materials, tempMaterial]);
    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
    
    Alert.alert(
      'File Selected', 
      `${newMaterial.title} will be uploaded when you save the lesson plan.`,
      [{ text: 'OK' }]
    );
  };

  // Upload all pending files and get their URLs
  const uploadPendingFiles = async (): Promise<{ [tempId: string]: string }> => {
    const uploadedUrls: { [tempId: string]: string } = {};
    
    if (pendingFileUploads.length === 0) {
      return uploadedUrls;
    }
    
    for (const pendingUpload of pendingFileUploads) {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', pendingUpload.title);
        formData.append('type', pendingUpload.fileType === 'image' ? 'image' : pendingUpload.fileType);
        formData.append('description', 'Lesson plan material');
        
        // Add the file to FormData
        const fileData = {
          uri: pendingUpload.file.uri,
          type: pendingUpload.file.type || pendingUpload.file.mimeType || 
                (pendingUpload.fileType === 'image' ? 'image/jpeg' : 
                 pendingUpload.fileType === 'video' ? 'video/mp4' : 'application/octet-stream'),
          name: pendingUpload.file.fileName || pendingUpload.file.name || 
                `${pendingUpload.fileType}_${Date.now()}.${pendingUpload.fileType === 'image' ? 'jpg' : 
                 pendingUpload.fileType === 'video' ? 'mp4' : 'pdf'}`,
        };
        
        formData.append('file', fileData as any);
        
        // Upload to backend
        const response = await fetch(`${API_URL}/lesson-plans/upload-material`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
          },
          body: formData,
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Upload failed');
        }

        // Store the uploaded URL for this temp ID
        uploadedUrls[pendingUpload.tempId] = result.data.url;
        
      } catch (error) {
        console.error(`❌ Failed to upload ${pendingUpload.title}:`, error);
        throw new Error(`Failed to upload ${pendingUpload.title}: ${error}`);
      }
    }
    
    return uploadedUrls;
  };

  const addMaterial = () => {
    // Handle file uploads for photo, video, and document types
    if (newMaterial.type === 'photo') {
      handleImagePicker();
      return;
    }
    
    if (newMaterial.type === 'video') {
      handleVideoPicker();
      return;
    }
    
    if (newMaterial.type === 'document') {
      handleDocumentPicker();
      return;
    }

    // Handle text and link types
    if (!newMaterial.title.trim() || !newMaterial.content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content for the material.');
      return;
    }

    setMaterials([...materials, { ...newMaterial }]);
    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
  };

  const removeMaterial = async (index: number) => {
    const materialToRemove = materials[index];
    
    // Show confirmation dialog
    Alert.alert(
      'Remove Material',
      `Are you sure you want to remove "${materialToRemove.title}"?\n\n${
        editingPlan && materialToRemove.content.startsWith('http') 
          ? 'This will permanently delete the file from cloud storage.' 
          : 'This file will be removed from the lesson plan.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            // If we're editing an existing lesson plan and the material has a real URL (not a temp ID)
            if (editingPlan && materialToRemove.content && 
                (materialToRemove.content.startsWith('http') || materialToRemove.content.startsWith('https'))) {
              
              try {
                // Call backend to delete the file from Supabase Storage
                await lessonPlanService.deleteMaterial(editingPlan.id || editingPlan._id!, index);
              } catch (error) {
                console.error('❌ Failed to delete file from storage:', error);
                Alert.alert(
                  'Delete Failed', 
                  'Failed to delete file from cloud storage. Please try again.',
                  [{ text: 'OK' }]
                );
                return; // Don't remove from UI if backend deletion failed
              }
            }
            
            // Remove from local state
            setMaterials(materials.filter((_, i) => i !== index));
            
            // Also remove from pending uploads if it's a pending file
            setPendingFileUploads(pendingFileUploads.filter(upload => upload.tempId !== materialToRemove.content));
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    // Comprehensive field validation
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter the subject.');
      return;
    }

    if (!topic.trim()) {
      Alert.alert('Validation Error', 'Please enter the topic.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description for the lesson.');
      return;
    }

    if (!duration.trim()) {
      Alert.alert('Validation Error', 'Please specify the lesson duration.');
      return;
    }

    // Validate date format dd/mm/yyyy -> convert to ISO date for backend
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      Alert.alert('Validation Error', 'Please select a valid date.');
      return;
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2030) {
      Alert.alert('Validation Error', 'Please enter a valid date (dd/mm/yyyy).');
      return;
    }
    
    const isoDate = new Date(year, month, day);
    if (isNaN(isoDate.getTime())) {
      Alert.alert('Validation Error', 'Please select a valid date.');
      return;
    }

    // Validate time HH:MM format
    const timeMatch = startTime.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) {
      Alert.alert('Validation Error', 'Please select a valid start time (HH:MM format).');
      return;
    }

    // Validate duration is numeric and reasonable
    const durationNum = parseInt(duration.trim(), 10);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 600) {
      Alert.alert('Validation Error', 'Please enter a valid duration between 1-600 minutes.');
      return;
    }

    // Check if date is not in the past (unless editing)
    if (!editingPlan) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isoDate < today) {
        Alert.alert('Validation Error', 'Please select a future date for the lesson plan.');
        return;
      }
    }
    setSavingLessonPlan(true);
    
    try {
      let finalMaterials = [...materials];
      
      // Upload all pending files first
      if (pendingFileUploads.length > 0) {
        const uploadedUrls = await uploadPendingFiles();
        
        // Replace temporary IDs with actual URLs in materials
        finalMaterials = materials.map(material => {
          if (uploadedUrls[material.content]) {
            return {
              ...material,
              content: uploadedUrls[material.content]
            };
          }
          return material;
        });
        
        // Clear pending uploads after successful upload
        setPendingFileUploads([]);
      }

      const lessonPlan: Omit<LessonPlan, 'id' | '_id'> = {
        subject: subject.trim(),
        topic: topic.trim(),
        description: description.trim(),
        // send ISO date string to backend
        date: isoDate.toISOString(),
        startTime,
        duration: durationNum,
        materials: finalMaterials,
        completed: editingPlan?.completed || false,
      };

      onSave(lessonPlan);
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      Alert.alert(
        'Save Failed', 
        `Failed to save lesson plan: ${error}`,
        [{ text: 'OK' }]
      );
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

  const renderMaterial = (material: LessonPlan['materials'][0], index: number) => {
    // Extra safety: ensure material is an object with expected properties
    if (!material || typeof material !== 'object') {
      console.warn('Invalid material object:', material);
      return null;
    }

    const getIcon = () => {
      switch (material.type) {
        case 'photo': return '📷';
        case 'video': return '🎥';
        case 'text': return '📝';
        case 'link': return '🔗';
        case 'document': return '📄';
        default: return '📄';
      }
    };

    const getContentDisplay = () => {
      // Ensure we always return a string to render inside <Text>
      const content = material && material.content;
      console.log('Rendering material content:', typeof content, content);
      
      if (material.type === 'photo' || material.type === 'video' || material.type === 'document') {
        // If content is an object, convert to a readable string
        const contentStr = typeof content === 'string' ? content : (content ? JSON.stringify(content) : '');

        // Check if this is a pending upload (temp ID)
        const isPendingUpload = pendingFileUploads.some(pending => pending.tempId === contentStr);
        if (isPendingUpload) {
          return '📤 Will upload when lesson is saved';
        }

        // For uploaded files, show a shortened URL or "Uploaded file"
        if (typeof contentStr === 'string' && contentStr.startsWith && contentStr.startsWith('http')) {
          return 'Uploaded file (click to view)';
        }

        return contentStr || '';
      }

      // For text/link types ensure string
      return typeof content === 'string' ? content : (content ? String(content) : '');
    };

    return (
      <View
        key={index}
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
          <SafeText style={[tw['text-lg'], tw['mr-3']]} context="material-icon">{getIcon()}</SafeText>
          <View style={[tw['flex-1']]}>
            <SafeText style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800']]} context="material-title">
              {material?.title}
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
          <SafeText style={[tw['text-sm'], tw['text-white']]} context="remove-x">×</SafeText>
        </TouchableOpacity>
      </View>
    );
  };

  console.log('Rendering AddLessonPlan, materials count:', materials?.length || 0);
  console.log('Current state values:', {
    subject: typeof subject,
    topic: typeof topic,
    date: typeof date,
    startTime: typeof startTime,
    duration: typeof duration,
    description: typeof description
  });
  console.log('Actual values:', { subject, topic, date, startTime, duration, description });
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Top-level render error in AddLessonPlan:', error);
          console.error('Error info:', errorInfo);
          console.error('State at error:', {
            visible,
            subject,
            topic,
            date,
            startTime,
            duration,
            description,
            materials,
            newMaterial,
            pendingFileUploads,
          });
        }}
        fallback={
          <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}> 
                <View style={[tw['p-4'], { backgroundColor: '#fef2f2', borderRadius: 8 }]}>
                  <SafeText style={{ color: '#dc2626' }} context="fallback-error">Error rendering lesson plan form</SafeText>
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
              <SafeText style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]} context="header-cancel">Cancel</SafeText>
            </TouchableOpacity>
            <SafeText style={[tw['text-xl'], tw['font-bold'], tw['text-gray-800']]} context="modal-title">
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
              <SafeText style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]} context="save-button">{savingLessonPlan ? 'Saving...' : 'Save'}</SafeText>
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
              <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-subject">Subject *</SafeText>
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
              <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-topic">Topic *</SafeText>
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
                <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-date">Date *</SafeText>
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
                        <SafeText style={[tw['text-base'], tw['text-gray-800']]} context="date-field">{date}</SafeText>
                        <SafeText style={[tw['text-lg']]} context="icon-calendar">📅</SafeText>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[tw['flex-1'], tw['ml-2']]}>
                <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-time">Time *</SafeText>
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
                    <SafeText style={[tw['text-base'], tw['text-gray-800']]} context="time-field">{startTime}</SafeText>
                    <SafeText style={[tw['text-lg']]} context="icon-clock">🕐</SafeText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>            {showDatePicker && (
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
              <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-duration">Duration (minutes) *</SafeText>
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
              <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="label-description">Description *</SafeText>
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
                <SafeText style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800']]} context="materials-header">Teaching Materials</SafeText>
                <TouchableOpacity
                  style={[
                    tw['bg-blue-600'],
                    tw['px-3'],
                    tw['py-2'],
                    tw['rounded-xl'],
                  ]}
                  onPress={() => setShowMaterialModal(true)}
                >
                  <SafeText style={[tw['text-sm'], tw['text-white'], tw['font-semibold']]} context="add-material-btn">➕ Add Material</SafeText>
                </TouchableOpacity>
              </View>

              <ErrorBoundary
                onError={(error, errorInfo) => {
                  console.error('Materials rendering error:', error);
                  console.error('Materials error info:', errorInfo);
                  console.error('Current materials state:', materials);
                }}
                fallback={
                  <View style={[tw['p-4'], { backgroundColor: '#fef2f2', borderRadius: 8 }]}>
                        <SafeText style={[{ color: '#dc2626' }]} context="materials-fallback">Error rendering materials</SafeText>
                      </View>
                }
              >
                {materials && Array.isArray(materials) ? materials.map((material, index) => {
                  // Extra safety check for each material
                  if (!material || typeof material !== 'object') {
                    console.warn('Skipping invalid material at index', index, material);
                    return null;
                  }
                  try {
                    const rendered = renderMaterial(material, index);
                    if (rendered === null || rendered === undefined) {
                      console.warn('renderMaterial returned null/undefined for index', index);
                      return null;
                    }
                    return rendered;
                  } catch (error) {
                    console.error('Error rendering material at index', index, error);
                    return null;
                  }
                }).filter(Boolean) : null}
              </ErrorBoundary>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Material Modal */}
        <Modal visible={showMaterialModal} transparent animationType="slide">
          <View style={[tw['flex-1'], { backgroundColor: 'rgba(0,0,0,0.5)' }, tw['items-center'], tw['justify-center']]}>
            <View style={[tw['bg-white'], tw['rounded-xl'], tw['p-5'], tw['w-80'], tw['mx-4']]}>
                <SafeText style={[tw['text-lg'], tw['font-bold'], tw['text-gray-800'], tw['mb-4'], tw['text-center']]} context="material-modal-title">
                  Add Teaching Material
                </SafeText>

              {/* Material Type Selector */}
              <SafeText style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="material-type-label">Type</SafeText>
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
                      {safeText(getTypeLabel(type), 'type-label')}
                    </SafeText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <SafeText style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="material-title-label">Title</SafeText>
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
              {newMaterial.type === 'text' || newMaterial.type === 'link' ? (
                <>
                  <SafeText style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="material-content-label">
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
              ) : (
                <View style={[tw['mb-4']]}>
                  <SafeText style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]} context="file-upload-label">File Upload</SafeText>
                  <View style={[tw['bg-gray-50'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['p-4'], tw['items-center']]}>
                      <SafeText style={[tw['text-2xl'], tw['mb-2']]} context="file-emoji">
                        {newMaterial.type === 'photo' ? '📷' : newMaterial.type === 'video' ? '🎥' : '📄'}
                      </SafeText>
                      <SafeText style={[tw['text-sm'], tw['text-gray-600'], tw['text-center'], tw['mb-2']]} context="file-description">
                        {newMaterial.type === 'photo' ? 'Take a photo or select from gallery' : 
                         newMaterial.type === 'video' ? 'Record a video or select from gallery' : 
                         'Select a document file'}
                      </SafeText>
                      <SafeText style={[tw['text-xs'], tw['text-gray-500'], tw['text-center']]} context="file-hint">Click "Add" to choose file</SafeText>
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
                  <SafeText style={[tw['text-base'], tw['text-gray-600'], tw['text-center']]} context="material-modal-cancel">Cancel</SafeText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    tw['bg-blue-600'], 
                    tw['px-4'], 
                    tw['py-2'], 
                    tw['rounded-xl'], 
                    tw['flex-1'], 
                    tw['ml-2'],
                    uploadingFile && tw['opacity-50']
                  ]}
                  onPress={addMaterial}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                      <View style={[tw['flex-row'], tw['items-center'], tw['justify-center']]}>
                      <ActivityIndicator size="small" color="white" style={[tw['mr-2']]} />
                      <SafeText style={[tw['text-base'], tw['text-white'], tw['font-semibold']]} context="uploading-text">Uploading...</SafeText>
                    </View>
                  ) : (
                    <SafeText style={[tw['text-base'], tw['text-white'], tw['font-semibold'], tw['text-center']]} context="material-modal-add">
                      {newMaterial.type === 'text' || newMaterial.type === 'link' ? 'Add' : 'Choose File'}
                    </SafeText>
                  )}
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
