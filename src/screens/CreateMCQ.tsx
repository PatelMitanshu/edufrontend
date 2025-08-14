import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import { mcqService } from '../services/mcqService';

type RootStackParamList = {
  CreateMCQ: { standardId: string; standardName: string };
  MCQPreview: { mcqData: any; standardId: string; standardName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateMCQ'>;

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function CreateMCQ({ route, navigation }: Props) {
  const { standardId, standardName } = route.params;
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState('5');
  const [bookLanguage, setBookLanguage] = useState('English');
  const [questionLanguage, setQuestionLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLanguageType, setCurrentLanguageType] = useState<'book' | 'question'>('book');

  const languages = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Punjabi'];

  const selectImage = () => {
    Alert.alert(
      'Select Image',
      'Choose an option to select book image',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      setSelectedImage(response.assets[0].uri || null);
    }
  };

  const generateMCQ = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select a book image first');
      return;
    }

    if (!questionCount || parseInt(questionCount) < 1 || parseInt(questionCount) > 20) {
      Alert.alert('Error', 'Please enter a valid question count (1-20)');
      return;
    }

    try {
      setIsGenerating(true);

      // Test authentication first
      console.log('Testing authentication...');
      const authTest = await mcqService.testAuth();
      console.log('Auth test result:', authTest);

      if (!authTest.success) {
        Alert.alert('Authentication Error', authTest.message + '. Please login again.');
        return;
      }

      // Check service status
      console.log('Checking AI service status...');
      const statusCheck = await mcqService.checkServiceStatus();
      console.log('Service status:', statusCheck);
      
      if (!statusCheck.success && statusCheck.status === 'overloaded') {
        Alert.alert(
          'Service Temporarily Unavailable',
          'The AI service is currently overloaded. Please try again in a few minutes.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Check Status & Retry', 
              style: 'default',
              onPress: generateMCQ 
            }
          ]
        );
        return;
      }

      console.log('Authentication successful, generating MCQ...');
      const result = await mcqService.generateMCQ({
        image: selectedImage,
        questionCount,
        bookLanguage,
        questionLanguage,
        standardId,
      });

      navigation.navigate('MCQPreview', {
        mcqData: result.questions,
        standardId,
        standardName,
      });
    } catch (error) {
      console.error('Error generating MCQ:', error);
      
      // Check if it's a retryable service unavailable error
      if (error instanceof Error && (error as any).retryable) {
        const retryDelayMinutes = Math.ceil(((error as any).suggestedRetryDelay || 60000) / 60000);
        Alert.alert(
          'Service Temporarily Unavailable',
          `${error.message}\n\nThis usually resolves within ${retryDelayMinutes} minute${retryDelayMinutes !== 1 ? 's' : ''}. Please try again later.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Try Again', 
              style: 'default',
              onPress: generateMCQ 
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to generate MCQ questions. Please try again.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Try Again', 
              style: 'default',
              onPress: generateMCQ 
            }
          ]
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const selectLanguage = (language: string) => {
    if (currentLanguageType === 'book') {
      setBookLanguage(language);
    } else {
      setQuestionLanguage(language);
    }
    setShowLanguageModal(false);
  };

  const openLanguageModal = (type: 'book' | 'question') => {
    setCurrentLanguageType(type);
    setShowLanguageModal(true);
  };

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          tw['px-6'],
          tw['py-4'],
          { paddingTop: 48, backgroundColor: theme.colors.primary },
        ]}
      >
        <View style={[tw['flex-row'], tw['items-center'], tw['justify-between']]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home' as never)}
            style={[
              tw['w-10'],
              tw['h-10'],
              tw['rounded-full'],
              tw['items-center'],
              tw['justify-center'],
              { backgroundColor: 'rgba(255,255,255,0.2)' },
            ]}
          >
            <Text style={[tw['text-lg'], { color: theme.colors.surface }]}>
              ←
            </Text>
          </TouchableOpacity>
          <Text
            style={[
              tw['text-xl'],
              tw['font-bold'],
              { color: theme.colors.surface },
            ]}
          >
            Create MCQ Test
          </Text>
          <View style={[tw['w-10']]} />
        </View>
        <Text
          style={[
            tw['text-sm'],
            tw['mt-2'],
            tw['text-center'],
            { color: theme.colors.surface, opacity: 0.8 },
          ]}
        >
          Standard {standardName}
        </Text>
      </View>

      <ScrollView style={[tw['flex-1']]} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        <View style={[tw['px-6'], { paddingTop: 24 }]}>
          <Text
            style={[
              tw['text-lg'],
              tw['font-semibold'],
              tw['mb-4'],
              { color: theme.colors.text },
            ]}
          >
            1. Select Book Image
          </Text>
          
          <TouchableOpacity
            style={[
              tw['border-2'],
              tw['rounded-xl'],
              tw['p-8'],
              tw['items-center'],
              tw['justify-center'],
              tw['mb-6'],
              {
                borderStyle: 'dashed',
                borderColor: selectedImage ? theme.colors.primary : theme.colors.border,
                backgroundColor: selectedImage ? theme.colors.primaryLight : theme.colors.surface,
                minHeight: 200,
              },
            ]}
            onPress={selectImage}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={[{ width: '100%', height: 192 }, tw['rounded-lg']]}
                resizeMode="contain"
              />
            ) : (
              <>
                <Text style={[tw['text-4xl'], tw['mb-4']]}>📷</Text>
                <Text
                  style={[
                    tw['text-lg'],
                    tw['font-semibold'],
                    tw['mb-2'],
                    { color: theme.colors.text },
                  ]}
                >
                  Take Photo of Book Page
                </Text>
                <Text
                  style={[
                    tw['text-sm'],
                    tw['text-center'],
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  AI will analyze the content and generate MCQ questions
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Question Count */}
          <Text
            style={[
              tw['text-lg'],
              tw['font-semibold'],
              tw['mb-4'],
              { color: theme.colors.text },
            ]}
          >
            2. Number of Questions
          </Text>
          
          <TextInput
            style={[
              tw['border'],
              tw['rounded-lg'],
              tw['px-4'],
              tw['py-3'],
              tw['text-lg'],
              tw['mb-6'],
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            value={questionCount}
            onChangeText={setQuestionCount}
            placeholder="Enter number of questions (1-20)"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />

          {/* Language Selection */}
          <Text
            style={[
              tw['text-lg'],
              tw['font-semibold'],
              tw['mb-4'],
              { color: theme.colors.text },
            ]}
          >
            3. Language Settings
          </Text>

          <View style={[tw['mb-4']]}>
            <Text
              style={[
                tw['text-sm'],
                tw['font-medium'],
                tw['mb-2'],
                { color: theme.colors.text },
              ]}
            >
              Book Language
            </Text>
            <TouchableOpacity
              style={[
                tw['border'],
                tw['rounded-lg'],
                tw['px-4'],
                tw['py-3'],
                tw['flex-row'],
                tw['items-center'],
                tw['justify-between'],
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => openLanguageModal('book')}
            >
              <Text style={[tw['text-lg'], { color: theme.colors.text }]}>
                {bookLanguage}
              </Text>
              <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[tw['mb-6']]}>
            <Text
              style={[
                tw['text-sm'],
                tw['font-medium'],
                tw['mb-2'],
                { color: theme.colors.text },
              ]}
            >
              Question Language
            </Text>
            <TouchableOpacity
              style={[
                tw['border'],
                tw['rounded-lg'],
                tw['px-4'],
                tw['py-3'],
                tw['flex-row'],
                tw['items-center'],
                tw['justify-between'],
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={() => openLanguageModal('question')}
            >
              <Text style={[tw['text-lg'], { color: theme.colors.text }]}>
                {questionLanguage}
              </Text>
              <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[
              tw['rounded-lg'],
              tw['px-6'],
              tw['py-4'],
              tw['items-center'],
              { marginBottom: 32 },
              {
                backgroundColor: selectedImage && questionCount ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={generateMCQ}
            disabled={!selectedImage || !questionCount || isGenerating}
          >
            {isGenerating ? (
              <View style={[tw['flex-row'], tw['items-center']]}>
                <ActivityIndicator size="small" color={theme.colors.surface} />
                <Text
                  style={[
                    tw['text-lg'],
                    tw['font-semibold'],
                    tw['ml-2'],
                    { color: theme.colors.surface },
                  ]}
                >
                  Generating MCQ...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  tw['text-lg'],
                  tw['font-semibold'],
                  { color: theme.colors.surface },
                ]}
              >
                Generate MCQ Questions
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View
          style={[
            tw['flex-1'],
            tw['justify-center'],
            tw['items-center'],
            { backgroundColor: 'rgba(0,0,0,0.5)' },
          ]}
        >
          <View
            style={[
              tw['w-80'],
              tw['rounded-xl'],
              tw['p-6'],
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[
                tw['text-lg'],
                tw['font-semibold'],
                tw['mb-4'],
                tw['text-center'],
                { color: theme.colors.text },
              ]}
            >
              Select {currentLanguageType === 'book' ? 'Book' : 'Question'} Language
            </Text>
            
            <ScrollView style={[{ maxHeight: 300 }]}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    tw['py-3'],
                    tw['px-4'],
                    tw['mb-2'],
                    tw['rounded-lg'],
                    {
                      backgroundColor:
                        (currentLanguageType === 'book' ? bookLanguage : questionLanguage) === language
                          ? theme.colors.primaryLight
                          : theme.colors.background,
                    },
                  ]}
                  onPress={() => selectLanguage(language)}
                >
                  <Text
                    style={[
                      tw['text-lg'],
                      {
                        color:
                          (currentLanguageType === 'book' ? bookLanguage : questionLanguage) === language
                            ? theme.colors.primary
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[
                tw['mt-4'],
                tw['py-3'],
                tw['px-6'],
                tw['rounded-lg'],
                tw['items-center'],
                { backgroundColor: theme.colors.border },
              ]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[tw['text-lg'], { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
