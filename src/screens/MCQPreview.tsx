import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import { mcqService } from '../services/mcqService';

type RootStackParamList = {
  MCQPreview: { mcqData: MCQQuestion[]; standardId: string; standardName: string; testId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MCQPreview'>;

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export default function MCQPreview({ route, navigation }: Props) {
  const { mcqData = [], standardId, standardName, testId } = route.params;
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<MCQQuestion[]>(mcqData || []);

  // Safety check for mcqData
  if (!mcqData || !Array.isArray(mcqData) || mcqData.length === 0) {
    return (
      <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: theme.colors.background }]}>
        <Text style={[tw['text-lg'], { color: theme.colors.text }]}>No questions available</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[tw['mt-4'], tw['px-6'], tw['py-2'], tw['rounded-full'], { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[{ color: theme.colors.surface }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const saveMCQTest = async () => {
    try {
      setIsSaving(true);

      const questionsToSave = isEditMode ? editedQuestions : mcqData;

      let result;
      
      if (testId) {
        // Update existing test
        result = await mcqService.updateMCQTest(testId, {
          standardId,
          questions: questionsToSave,
          title: `MCQ Test - ${standardName} - ${new Date().toLocaleDateString()}`,
          description: `AI Generated MCQ Test for Standard ${standardName}`,
        });
      } else {
        // Create new test
        result = await mcqService.saveMCQTest({
          standardId,
          questions: questionsToSave,
          title: `MCQ Test - ${standardName} - ${new Date().toLocaleDateString()}`,
          description: `AI Generated MCQ Test for Standard ${standardName}`,
        });
      }

      Alert.alert(
        'Success',
        testId ? 'MCQ test updated successfully!' : 'MCQ test saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              if (testId) {
                // For updated tests, navigate back to MCQTest page to show the updated test list
                navigation.reset({
                  index: 1,
                  routes: [
                    { name: 'Dashboard' as never },
                    { name: 'MCQTest' as never }
                  ],
                });
              } else {
                // For new tests, navigate back to Dashboard (Home)
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Dashboard' as never }],
                });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving MCQ:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save MCQ test. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditModeToggle = () => {
    if (isEditMode) {
      // Save changes and exit edit mode
      setIsEditMode(false);
    } else {
      // Enter edit mode
      setEditedQuestions([...mcqData]);
      setIsEditMode(true);
    }
  };

  const updateQuestion = (questionIndex: number, field: string, value: string) => {
    const updatedQuestions = [...editedQuestions];
    if (field === 'question') {
      updatedQuestions[questionIndex].question = value;
    } else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.replace('option', ''));
      updatedQuestions[questionIndex].options[optionIndex] = value;
    } else if (field === 'explanation') {
      updatedQuestions[questionIndex].explanation = value;
    }
    setEditedQuestions(updatedQuestions);
  };

  const updateCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...editedQuestions];
    updatedQuestions[questionIndex].correctAnswer = optionIndex;
    setEditedQuestions(updatedQuestions);
  };

  const handleBackPress = () => {
    if (isEditMode) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => {
              setIsEditMode(false);
              setEditedQuestions([...mcqData]);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' as never }],
              });
            },
          },
          {
            text: 'Save & Exit',
            onPress: () => {
              saveMCQTest();
            },
          },
        ]
      );
    } else {
      // Navigate to Dashboard (Home) instead of going back to CreateMCQ
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' as never }],
      });
    }
  };

  const deleteQuestion = (questionIndex: number) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedQuestions = editedQuestions.filter((_, index) => index !== questionIndex);
            setEditedQuestions(updatedQuestions);
          },
        },
      ]
    );
  };

  const renderQuestion = (question: MCQQuestion, index: number) => {
    const currentQuestion = isEditMode ? editedQuestions[index] : question;
    
    return (
      <View
        key={index}
        style={[
          tw['bg-white'],
          tw['rounded-xl'],
          tw['p-6'],
          tw['mb-4'],
          tw['mx-4'],
          {
            backgroundColor: theme.colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      >
        {/* Question Number and Edit/Delete Controls */}
        <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['mb-4']]}>
          <View style={[tw['flex-row'], tw['items-center']]}>
            <View
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['mr-3'],
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  tw['text-sm'],
                  tw['font-bold'],
                  { color: theme.colors.surface },
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                tw['text-lg'],
                tw['font-semibold'],
                { color: theme.colors.text },
              ]}
            >
              Question {index + 1}
            </Text>
          </View>
          {isEditMode && (
            <TouchableOpacity
              onPress={() => deleteQuestion(index)}
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                { backgroundColor: '#ff4444' + '20' },
              ]}
            >
              <Text style={[{ color: '#ff4444', fontSize: 16 }]}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Question Text */}
        {isEditMode ? (
          <TextInput
            style={[
              tw['text-lg'],
              tw['mb-4'],
              tw['p-3'],
              tw['rounded-lg'],
              { 
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                minHeight: 60,
                textAlignVertical: 'top'
              },
            ]}
            value={currentQuestion.question}
            onChangeText={(text) => updateQuestion(index, 'question', text)}
            multiline
            placeholder="Enter question text..."
            placeholderTextColor={theme.colors.textSecondary}
          />
        ) : (
          <Text
            style={[
              tw['text-lg'],
              tw['font-semibold'],
              tw['mb-4'],
              { color: theme.colors.text },
            ]}
          >
            {currentQuestion.question}
          </Text>
        )}

        {/* Options */}
        {currentQuestion.options.map((option, optionIndex) => (
          <View
            key={optionIndex}
            style={[
              tw['flex-row'],
              tw['items-center'],
              tw['mb-2'],
              tw['rounded-lg'],
              {
                backgroundColor:
                  optionIndex === currentQuestion.correctAnswer
                    ? theme.colors.primary + '20'
                    : theme.colors.background,
                borderWidth: optionIndex === currentQuestion.correctAnswer ? 2 : 1,
                borderColor:
                  optionIndex === currentQuestion.correctAnswer
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
          >
            {isEditMode ? (
              <TouchableOpacity
                onPress={() => updateCorrectAnswer(index, optionIndex)}
                style={[
                  tw['w-6'],
                  { height: 24, marginHorizontal: 12 },
                  tw['rounded-full'],
                  tw['items-center'],
                  tw['justify-center'],
                  {
                    backgroundColor:
                      optionIndex === currentQuestion.correctAnswer
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    tw['text-sm'],
                    tw['font-bold'],
                    {
                      color:
                        optionIndex === currentQuestion.correctAnswer
                          ? theme.colors.surface
                          : theme.colors.text,
                    },
                  ]}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  tw['w-6'],
                  { height: 24, marginHorizontal: 12 },
                  tw['rounded-full'],
                  tw['items-center'],
                  tw['justify-center'],
                  {
                    backgroundColor:
                      optionIndex === currentQuestion.correctAnswer
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    tw['text-sm'],
                    tw['font-bold'],
                    {
                      color:
                        optionIndex === currentQuestion.correctAnswer
                          ? theme.colors.surface
                          : theme.colors.text,
                    },
                  ]}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </Text>
              </View>
            )}
            
            {isEditMode ? (
              <TextInput
                style={[
                  tw['flex-1'],
                  tw['text-base'],
                  tw['py-3'],
                  {
                    paddingRight: 12,
                    color:
                      optionIndex === currentQuestion.correctAnswer
                        ? theme.colors.primary
                        : theme.colors.text,
                    fontWeight: optionIndex === currentQuestion.correctAnswer ? 'bold' : 'normal',
                  },
                ]}
                value={option}
                onChangeText={(text) => updateQuestion(index, `option${optionIndex}`, text)}
                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                placeholderTextColor={theme.colors.textSecondary}
              />
            ) : (
              <Text
                style={[
                  tw['flex-1'],
                  tw['text-base'],
                  tw['py-3'],
                  {
                    paddingRight: 12,
                    color:
                      optionIndex === currentQuestion.correctAnswer
                        ? theme.colors.primary
                        : theme.colors.text,
                    fontWeight: optionIndex === currentQuestion.correctAnswer ? 'bold' : 'normal',
                  },
                ]}
              >
                {option}
              </Text>
            )}
            
            {optionIndex === currentQuestion.correctAnswer && (
              <Text style={[tw['text-lg'], tw['mr-3'], { color: theme.colors.primary }]}>
                ✓
              </Text>
            )}
          </View>
        ))}

        {/* Explanation */}
        <View
          style={[
            tw['mt-4'],
            tw['p-3'],
            tw['rounded-lg'],
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              tw['text-sm'],
              tw['font-semibold'],
              tw['mb-1'],
              { color: theme.colors.primary },
            ]}
          >
            Explanation:
          </Text>
          {isEditMode ? (
            <TextInput
              style={[
                tw['text-sm'],
                tw['p-2'],
                {
                  borderRadius: 4,
                  color: theme.colors.textSecondary,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  minHeight: 40,
                  textAlignVertical: 'top'
                },
              ]}
              value={currentQuestion.explanation || ''}
              onChangeText={(text) => updateQuestion(index, 'explanation', text)}
              multiline
              placeholder="Add explanation (optional)..."
              placeholderTextColor={theme.colors.textSecondary}
            />
          ) : currentQuestion.explanation ? (
            <Text
              style={[
                tw['text-sm'],
                { color: theme.colors.textSecondary },
              ]}
            >
              {currentQuestion.explanation}
            </Text>
          ) : (
            <Text
              style={[
                tw['text-sm'],
                { color: theme.colors.textSecondary, fontStyle: 'italic' },
              ]}
            >
              No explanation provided
            </Text>
          )}
        </View>
      </View>
    );
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
            onPress={handleBackPress}
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
            {isEditMode ? 'Edit MCQ Test' : 'MCQ Preview'}
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
          Standard {standardName} • {isEditMode ? editedQuestions.length : mcqData.length} Questions
          {isEditMode ? ' • Editing Mode' : ''}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={[tw['flex-1']]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingTop: 24, paddingBottom: 100 }]}
      >
        {mcqData && Array.isArray(mcqData) ? 
          (isEditMode ? editedQuestions : mcqData).map((question, index) => renderQuestion(question, index)) :
          <Text style={[tw['text-center'], { color: theme.colors.textSecondary, marginTop: 32 }]}>
            No questions to display
          </Text>
        }
      </ScrollView>

      {/* Bottom Actions */}
      <View
        style={[
          tw['px-6'],
          tw['py-4'],
          tw['flex-row'],
          tw['justify-between'],
          {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            tw['flex-1'],
            tw['rounded-lg'],
            tw['px-6'],
            tw['py-4'],
            tw['items-center'],
            tw['mr-3'],
            { backgroundColor: isEditMode ? theme.colors.primary : theme.colors.border },
          ]}
          onPress={handleEditModeToggle}
        >
          <Text
            style={[
              tw['text-lg'],
              tw['font-semibold'],
              { color: isEditMode ? theme.colors.surface : theme.colors.text },
            ]}
          >
            {isEditMode ? 'Done Editing' : 'Edit'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            tw['flex-1'],
            tw['rounded-lg'],
            tw['px-6'],
            tw['py-4'],
            tw['items-center'],
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={saveMCQTest}
          disabled={isSaving}
        >
          {isSaving ? (
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
                Saving...
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
              {testId ? 'Update Test' : 'Save Test'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
