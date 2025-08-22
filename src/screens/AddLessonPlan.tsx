import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import DocumentPicker, { DocumentPickerResponse, pick, types } from '@react-native-documents/picker';
import { launchImageLibrary, launchCamera, MediaType } from 'react-native-image-picker';
import { tw } from '../utils/tailwind';
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
  
  const [subject, setSubject] = useState(editingPlan?.subject || '');
  const [topic, setTopic] = useState(editingPlan?.topic || '');
  const [description, setDescription] = useState(editingPlan?.description || '');
  const [date, setDate] = useState(editingPlan?.date || new Date().toLocaleDateString());
  const [startTime, setStartTime] = useState(editingPlan?.startTime || '10:00');
  const [duration, setDuration] = useState(editingPlan?.duration?.toString() || '60');
  const [materials, setMaterials] = useState<LessonPlan['materials']>(editingPlan?.materials || []);
  
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
      setSubject(editingPlan.subject || '');
      setTopic(editingPlan.topic || '');
      setDescription(editingPlan.description || '');
      setDate(editingPlan.date || new Date().toLocaleDateString());
      setStartTime(editingPlan.startTime || '10:00');
      setDuration(editingPlan.duration != null ? String(editingPlan.duration) : '60');
      setMaterials(editingPlan.materials || []);
    } else {
      // fresh add
      resetForm();
    }

    // always start material composer clean
    setNewMaterial({ type: 'text', title: '', content: '' });
    setShowMaterialModal(false);
  }, [editingPlan, visible]);

  const resetForm = () => {
    setSubject('');
    setTopic('');
    setDescription('');
    setDate(new Date().toLocaleDateString());
    setStartTime('10:00');
    setDuration('60');
    setMaterials([]);
    setPendingFileUploads([]); // Clear pending file uploads
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
    if (!subject.trim() || !topic.trim()) {
      Alert.alert('Error', 'Please fill in subject and topic.');
      return;
    }

    if (!duration.trim()) {
      Alert.alert('Error', 'Please specify the lesson duration.');
      return;
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
        date,
        startTime,
        duration: parseInt(duration.trim()),
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
      if (material.type === 'photo' || material.type === 'video' || material.type === 'document') {
        // Check if this is a pending upload (temp ID)
        const isPendingUpload = pendingFileUploads.some(pending => pending.tempId === material.content);
        
        if (isPendingUpload) {
          return '📤 Will upload when lesson is saved';
        }
        
        // For uploaded files, show a shortened URL or "Uploaded file"
        if (material.content.startsWith('http')) {
          return 'Uploaded file (click to view)';
        }
        return material.content;
      }
      return material.content;
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
          <Text style={[tw['text-lg'], tw['mr-3']]}>{getIcon()}</Text>
          <View style={[tw['flex-1']]}>
            <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800']]}>
              {material.title}
            </Text>
            <Text 
              style={[tw['text-xs'], tw['text-gray-600'], { lineHeight: 16 }]} 
              numberOfLines={2}
            >
              {getContentDisplay()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[tw['w-8'], tw['h-8'], tw['rounded-full'], tw['bg-red-500'], tw['items-center'], tw['justify-center']]}
          onPress={() => removeMaterial(index)}
        >
          <Text style={[tw['text-sm'], tw['text-white']]}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        
        {/* Header */}
        <View style={[tw['bg-white'], tw['px-5'], tw['py-4'], tw['shadow-lg'], tw['border-b'], tw['border-gray-200']]}>
          <View style={[tw['flex-row'], tw['justify-between'], tw['items-center']]}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[tw['text-xl'], tw['font-bold'], tw['text-gray-800']]}>
              {editingPlan ? 'Edit Lesson Plan' : 'Add Lesson Plan'}
            </Text>
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
              <Text style={[tw['text-lg'], tw['text-blue-600'], tw['font-semibold']]}>
                {savingLessonPlan ? 'Saving...' : 'Save'}
              </Text>
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
              <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Subject *
              </Text>
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
              <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Topic *
              </Text>
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
                <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                  Date
                </Text>
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
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#9CA3AF"
                  value={date}
                  onChangeText={setDate}
                />
              </View>

              <View style={[tw['flex-1'], tw['ml-2']]}>
                <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                  Time
                </Text>
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
                  placeholder="10:00"
                  placeholderTextColor="#9CA3AF"
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
            </View>

            {/* Duration */}
            <View style={[tw['mb-4']]}>
              <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Duration *
              </Text>
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
                placeholder="e.g., 45 minutes, 1 hour"
                placeholderTextColor="#9CA3AF"
                value={duration}
                onChangeText={setDuration}
              />
            </View>

            {/* Description */}
            <View style={[tw['mb-4']]}>
              <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Description
              </Text>
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
                <Text style={[tw['text-base'], tw['font-semibold'], tw['text-gray-800']]}>
                  Teaching Materials
                </Text>
                <TouchableOpacity
                  style={[
                    tw['bg-blue-600'],
                    tw['px-3'],
                    tw['py-2'],
                    tw['rounded-xl'],
                  ]}
                  onPress={() => setShowMaterialModal(true)}
                >
                  <Text style={[tw['text-sm'], tw['text-white'], tw['font-semibold']]}>
                    ➕ Add Material
                  </Text>
                </TouchableOpacity>
              </View>

              {materials.map((material, index) => renderMaterial(material, index))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Material Modal */}
        <Modal visible={showMaterialModal} transparent animationType="slide">
          <View style={[tw['flex-1'], { backgroundColor: 'rgba(0,0,0,0.5)' }, tw['items-center'], tw['justify-center']]}>
            <View style={[tw['bg-white'], tw['rounded-xl'], tw['p-5'], tw['w-80'], tw['mx-4']]}>
              <Text style={[tw['text-lg'], tw['font-bold'], tw['text-gray-800'], tw['mb-4'], tw['text-center']]}>
                Add Teaching Material
              </Text>

              {/* Material Type Selector */}
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Type
              </Text>
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
                    <Text
                      style={[
                        tw['text-sm'],
                        tw['font-medium'],
                        tw['capitalize'],
                        newMaterial.type === type ? tw['text-white'] : tw['text-gray-800'],
                      ]}
                    >
                      {type === 'text' && '📝'} {type === 'photo' && '📷'} {type === 'video' && '🎥'} {type === 'document' && '📄'} {type === 'link' && '🔗'} {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                Title
              </Text>
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
                  <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                    {newMaterial.type === 'link' ? 'URL' : 'Content'}
                  </Text>
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
                  <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-gray-800'], tw['mb-2']]}>
                    File Upload
                  </Text>
                  <View style={[tw['bg-gray-50'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['p-4'], tw['items-center']]}>
                    <Text style={[tw['text-2xl'], tw['mb-2']]}>
                      {newMaterial.type === 'photo' ? '📷' : newMaterial.type === 'video' ? '🎥' : '📄'}
                    </Text>
                    <Text style={[tw['text-sm'], tw['text-gray-600'], tw['text-center'], tw['mb-2']]}>
                      {newMaterial.type === 'photo' ? 'Take a photo or select from gallery' : 
                       newMaterial.type === 'video' ? 'Record a video or select from gallery' : 
                       'Select a document file'}
                    </Text>
                    <Text style={[tw['text-xs'], tw['text-gray-500'], tw['text-center']]}>
                      Click "Add" to choose file
                    </Text>
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
                  <Text style={[tw['text-base'], tw['text-gray-600'], tw['text-center']]}>Cancel</Text>
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
                      <Text style={[tw['text-base'], tw['text-white'], tw['font-semibold']]}>Uploading...</Text>
                    </View>
                  ) : (
                    <Text style={[tw['text-base'], tw['text-white'], tw['font-semibold'], tw['text-center']]}>
                      {newMaterial.type === 'text' || newMaterial.type === 'link' ? 'Add' : 'Choose File'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

export default AddLessonPlan;
