import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentMCQService, MCQQuestion, TestSubmission } from '../services/studentMCQService';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';

interface TakeTestProps {
  studentId: string;
  testId: string;
  onTestComplete: (result: any) => void;
  onGoBack: () => void;
}

const TakeTest: React.FC<TakeTestProps> = ({
  studentId,
  testId,
  onTestComplete,
  onGoBack,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<{ selectedAnswer: number; timeTaken: number }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadTestData();
    
    // Handle back button
    const backAction = () => {
      if (hasStarted) {
        Alert.alert(
          'Exit Test?',
          'Are you sure you want to exit? Your progress will be lost.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: onGoBack },
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [hasStarted]);

  useEffect(() => {
    if (hasStarted && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            handleTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, hasStarted]);

  const loadTestData = async () => {
    try {
      const response = await studentMCQService.getTestQuestions(testId, studentId);
      
      if (!response.mcqTest) {
        throw new Error('Test data not found');
      }
      
      setTestData(response.mcqTest);
      setQuestions(response.mcqTest.questions || []);
      setTimeRemaining((response.mcqTest.timeLimit || 30) * 60); // Convert minutes to seconds
      setAnswers(new Array((response.mcqTest.questions || []).length).fill({ selectedAnswer: -1, timeTaken: 0 }));
    } catch (error) {Alert.alert('Error', 'Failed to load test. Please try again.');
      onGoBack();
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setHasStarted(true);
    setTestStartTime(new Date());
    setQuestionStartTime(new Date());
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Time Up!',
      'The test time has ended. Your answers will be submitted automatically.',
      [{ text: 'OK', onPress: submitTest }]
    );
  };

  const selectAnswer = (answerIndex: number) => {
    const now = new Date();
    const questionTime = questionStartTime ? (now.getTime() - questionStartTime.getTime()) / 1000 : 0;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      selectedAnswer: answerIndex,
      timeTaken: questionTime,
    };
    setAnswers(newAnswers);
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index);
    setQuestionStartTime(new Date());
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      navigateToQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      navigateToQuestion(currentQuestion - 1);
    }
  };

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const totalTime = testStartTime ? (new Date().getTime() - testStartTime.getTime()) / 1000 : 0;

      const submission: TestSubmission = {
        studentId,
        mcqId: testId,
        answers,
        timeTaken: totalTime,
        startedAt: testStartTime?.toISOString() || new Date().toISOString(),
      };

      const result = await studentMCQService.submitTest(submission);
      
      if (result && result.result) {
        onTestComplete(result);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {Alert.alert('Error', 'Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return answers.filter(answer => answer.selectedAnswer !== -1).length;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return '#f44336'; // Red for last 5 minutes
    if (timeRemaining <= 600) return '#FF9800'; // Orange for last 10 minutes
    return theme.colors.primary;
  };

  if (loading) {
    return (
      <View style={[
        tw['flex-1'],
        { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[tw['text-base'], { color: theme.colors.text, marginTop: 16 }]}>
          Loading test...
        </Text>
      </View>
    );
  }

  if (!hasStarted) {
    return (
      <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <Icon name="quiz" size={64} color={theme.colors.primary} />
            <Text style={[
              tw['text-2xl'],
              tw['font-bold'],
              { color: theme.colors.text, textAlign: 'center', marginTop: 16 }
            ]}>
              {testData?.title}
            </Text>
            {testData?.description && (
              <Text style={[
                tw['text-base'],
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }
              ]}>
                {testData.description}
              </Text>
            )}
          </View>

          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: theme.colors.text, marginBottom: 16 }
            ]}>
              Test Instructions
            </Text>

            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="quiz" size={20} color={theme.colors.primary} />
                <Text style={[tw['text-base'], { color: theme.colors.text, marginLeft: 8 }]}>
                  {testData?.questionsCount} questions
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="schedule" size={20} color={theme.colors.primary} />
                <Text style={[tw['text-base'], { color: theme.colors.text, marginLeft: 8 }]}>
                  {testData?.timeLimit} minutes time limit
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="warning" size={20} color="#FF9800" />
                <Text style={[tw['text-base'], { color: theme.colors.text, marginLeft: 8 }]}>
                  You can only take this test once
                </Text>
              </View>
            </View>

            <Text style={[
              tw['text-sm'],
              { color: theme.colors.textSecondary, lineHeight: 20 }
            ]}>
              • Read each question carefully{'\n'}
              • Select the best answer for each question{'\n'}
              • You can navigate between questions{'\n'}
              • Submit your test before time runs out{'\n'}
              • Once submitted, you cannot change your answers
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={startTest}
          >
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: 'white' }
            ]}>
              Start Test
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={onGoBack}
          >
            <Text style={[tw['text-base'], { color: theme.colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={{
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[
            tw['text-base'],
            tw['font-bold'],
            { color: theme.colors.text }
          ]}>
            Question {currentQuestion + 1} of {questions.length}
          </Text>
          
          <Text style={[
            tw['text-base'],
            tw['font-bold'],
            { color: getTimeColor() }
          ]}>
            {formatTime(timeRemaining)}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}>
          <Text style={[
            tw['text-sm'],
            { color: theme.colors.textSecondary }
          ]}>
            {getAnsweredCount()} of {questions.length} answered
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
            }}
            onPress={() => setShowSubmitModal(true)}
          >
            <Text style={[tw['text-xs'], { color: 'white' }]}>
              Submit Test
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <Text style={[
            tw['text-lg'],
            { color: theme.colors.text, lineHeight: 26, fontWeight: '500' }
          ]}>
            {currentQ?.question}
          </Text>
        </View>

        {/* Options */}
        {currentQ?.options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: answers[currentQuestion]?.selectedAnswer === index
                ? theme.colors.primary + '20'
                : theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: answers[currentQuestion]?.selectedAnswer === index ? 2 : 1,
              borderColor: answers[currentQuestion]?.selectedAnswer === index
                ? theme.colors.primary
                : theme.colors.border,
            }}
            onPress={() => selectAnswer(index)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: answers[currentQuestion]?.selectedAnswer === index
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: answers[currentQuestion]?.selectedAnswer === index
                  ? theme.colors.primary
                  : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                {answers[currentQuestion]?.selectedAnswer === index && (
                  <Icon name="check" size={16} color="white" />
                )}
              </View>
              
              <Text style={[
                tw['text-base'],
                {
                  color: theme.colors.text,
                  flex: 1,
                  lineHeight: 22,
                }
              ]}>
                {option}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={{
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: currentQuestion === 0 ? theme.colors.border : theme.colors.primary,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: currentQuestion === 0 ? 0.5 : 1,
          }}
          onPress={previousQuestion}
          disabled={currentQuestion === 0}
        >
          <Text style={[tw['text-base'], tw['font-bold'], { color: 'white' }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={[
          tw['text-sm'],
          { color: theme.colors.text }
        ]}>
          {currentQuestion + 1} / {questions.length}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: currentQuestion === questions.length - 1 ? theme.colors.border : theme.colors.primary,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            opacity: currentQuestion === questions.length - 1 ? 0.5 : 1,
          }}
          onPress={nextQuestion}
          disabled={currentQuestion === questions.length - 1}
        >
          <Text style={[tw['text-base'], tw['font-bold'], { color: 'white' }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit Confirmation Modal */}
      <Modal
        visible={showSubmitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 20,
            width: '100%',
            maxWidth: 300,
          }}>
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: theme.colors.text, textAlign: 'center', marginBottom: 16 }
            ]}>
              Submit Test?
            </Text>
            
            <Text style={[
              tw['text-base'],
              { color: theme.colors.text, textAlign: 'center', marginBottom: 20, lineHeight: 20 }
            ]}>
              You have answered {getAnsweredCount()} out of {questions.length} questions.
              {getAnsweredCount() < questions.length && '\n\nUnanswered questions will be marked as incorrect.'}
              {'\n\nOnce submitted, you cannot change your answers.'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                }}
                onPress={() => setShowSubmitModal(false)}
              >
                <Text style={[tw['text-base'], { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.primary,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowSubmitModal(false);
                  submitTest();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[tw['text-base'], tw['font-bold'], { color: 'white' }]}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TakeTest;
