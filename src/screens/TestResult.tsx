import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentMCQService } from '../services/studentMCQService';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';

interface TestResultProps {
  submissionId: string;
  onGoBack: () => void;
  onGoToTests: () => void;
}

const TestResult: React.FC<TestResultProps> = ({
  submissionId,
  onGoBack,
  onGoToTests,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadResult();
  }, [submissionId]);

  const loadResult = async () => {
    try {
      const response = await studentMCQService.getTestResult(submissionId);
      setResult(response.result);
    } catch (error) {
      console.error('Error loading result:', error);
      Alert.alert('Error', 'Failed to load test result.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return '#4CAF50';
      case 'B':
        return '#2196F3';
      case 'C':
        return '#FF9800';
      case 'D':
        return '#f44336';
      default:
        return theme.colors.text;
    }
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return 'emoji-events';
    if (percentage >= 80) return 'star';
    if (percentage >= 70) return 'thumb-up';
    if (percentage >= 60) return 'check-circle';
    return 'info';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Excellent work! Outstanding performance!';
    if (percentage >= 80) return 'Great job! You did really well!';
    if (percentage >= 70) return 'Good work! Keep it up!';
    if (percentage >= 60) return 'Nice effort! You passed the test!';
    return 'Keep practicing! You can do better next time!';
  };

  if (loading) {
    return (
      <View style={[
        tw['flex-1'],
        { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[tw['text-base'], { color: theme.colors.text, marginTop: 16 }]}>
          Loading results...
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={[
        tw['flex-1'],
        { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
      ]}>
        <Icon name="error" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
        <Text style={[tw['text-base'], { color: theme.colors.text, marginTop: 16 }]}>
          Failed to load test result
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginTop: 16,
          }}
          onPress={onGoBack}
        >
          <Text style={[tw['text-base'], { color: 'white' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { submission, mcqTest, analysis } = result;

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={{
        backgroundColor: theme.colors.card,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={onGoBack}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[
            tw['text-base'],
            { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }
          ]}>
            Test Result
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Test Info */}
        <View style={{ padding: 16 }}>
          <Text style={[
            tw['text-xl'],
            { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }
          ]}>
            {mcqTest.title}
          </Text>
          {mcqTest.description && (
            <Text style={[
              tw['text-base'],
              { color: theme.colors.text, opacity: 0.7, textAlign: 'center', marginTop: 4 }
            ]}>
              {mcqTest.description}
            </Text>
          )}
        </View>

        {/* Score Card */}
        <View style={{
          margin: 16,
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
        }}>
          <Icon
            name={getPerformanceIcon(analysis.performance.percentage)}
            size={64}
            color={getGradeColor(analysis.performance.grade)}
          />
          
          <Text style={[
            tw['text-5xl'],
            {
              color: getGradeColor(analysis.performance.grade),
              fontSize: 48,
              fontWeight: 'bold',
              marginTop: 16,
            }
          ]}>
            {analysis.performance.grade}
          </Text>
          
          <Text style={[
            tw['text-2xl'],
            { color: theme.colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 8 }
          ]}>
            {analysis.performance.percentage}%
          </Text>
          
          <Text style={[
            tw['text-base'],
            { color: theme.colors.text, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 22 }
          ]}>
            {getPerformanceMessage(analysis.performance.percentage)}
          </Text>
        </View>

        {/* Statistics */}
        <View style={{
          flexDirection: 'row',
          margin: 16,
          gap: 12,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={[
              tw['text-xl'],
              { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 }
            ]}>
              {analysis.accuracy.correct}
            </Text>
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
            ]}>
              Correct
            </Text>
          </View>
          
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}>
            <Icon name="cancel" size={24} color="#f44336" />
            <Text style={[
              tw['text-xl'],
              { color: theme.colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 8 }
            ]}>
              {analysis.accuracy.incorrect}
            </Text>
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
            ]}>
              Incorrect
            </Text>
          </View>
          
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}>
            <Icon name="schedule" size={24} color={theme.colors.primary} />
            <Text style={[
              tw['text-base'],
              { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginTop: 8 }
            ]}>
              {analysis.timing.formattedTime}
            </Text>
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
            ]}>
              Time Taken
            </Text>
          </View>
        </View>

        {/* Performance Analysis */}
        <View style={{
          margin: 16,
          backgroundColor: theme.colors.card,
          borderRadius: 12,
          padding: 16,
        }}>
          <Text style={[
            tw['text-base'],
            { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }
          ]}>
            Performance Analysis
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={[tw['text-sm'], { color: theme.colors.text, opacity: 0.8 }]}>
                Accuracy Rate
              </Text>
              <Text style={[tw['text-sm'], { color: theme.colors.text, fontWeight: 'bold' }]}>
                {analysis.accuracy.accuracyRate.toFixed(1)}%
              </Text>
            </View>
            <View style={{
              height: 6,
              backgroundColor: theme.colors.border,
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <View style={{
                width: `${analysis.accuracy.accuracyRate}%`,
                height: '100%',
                backgroundColor: getGradeColor(analysis.performance.grade),
              }} />
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={[tw['text-sm'], { color: theme.colors.text, opacity: 0.8 }]}>
              Avg. Time per Question
            </Text>
            <Text style={[tw['text-sm'], { color: theme.colors.text, fontWeight: 'bold' }]}>
              {analysis.timing.averageTimePerQuestion.toFixed(1)}s
            </Text>
          </View>
        </View>

        {/* Detailed Results Button */}
        <View style={{ margin: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowDetailedResults(!showDetailedResults)}
          >
            <Icon 
              name={showDetailedResults ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="white" 
            />
            <Text style={[
              tw['text-base'],
              { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
            ]}>
              {showDetailedResults ? 'Hide' : 'Show'} Question-wise Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Results */}
        {showDetailedResults && result.detailedAnswers && (
          <View style={{ margin: 16 }}>
            <Text style={[
              tw['text-base'],
              { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }
            ]}>
              Question-wise Analysis
            </Text>
            
            {result.detailedAnswers.map((detail: any, index: number) => (
              <View key={index} style={{
                backgroundColor: theme.colors.card,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: detail.isCorrect ? '#4CAF50' : '#f44336',
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[
                    tw['text-base'],
                    { color: theme.colors.text, fontWeight: 'bold' }
                  ]}>
                    Question {index + 1}
                  </Text>
                  <Icon
                    name={detail.isCorrect ? 'check-circle' : 'cancel'}
                    size={20}
                    color={detail.isCorrect ? '#4CAF50' : '#f44336'}
                  />
                </View>
                
                <Text style={[
                  tw['text-base'],
                  { color: theme.colors.text, marginBottom: 12, lineHeight: 20 }
                ]}>
                  {detail.question}
                </Text>
                
                {detail.options.map((option: string, optIndex: number) => (
                  <View key={optIndex} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: optIndex === detail.correctAnswer
                      ? '#4CAF50' + '20'
                      : optIndex === detail.studentAnswer && !detail.isCorrect
                      ? '#f44336' + '20'
                      : 'transparent',
                  }}>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: optIndex === detail.correctAnswer
                        ? '#4CAF50'
                        : optIndex === detail.studentAnswer
                        ? '#f44336'
                        : theme.colors.border,
                      backgroundColor: optIndex === detail.correctAnswer
                        ? '#4CAF50'
                        : optIndex === detail.studentAnswer && !detail.isCorrect
                        ? '#f44336'
                        : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8,
                    }}>
                      {(optIndex === detail.correctAnswer || optIndex === detail.studentAnswer) && (
                        <Icon
                          name={optIndex === detail.correctAnswer ? 'check' : 'close'}
                          size={12}
                          color="white"
                        />
                      )}
                    </View>
                    
                    <Text style={[
                      tw['text-base'],
                      {
                        color: theme.colors.text,
                        flex: 1,
                        fontWeight: optIndex === detail.correctAnswer || optIndex === detail.studentAnswer
                          ? 'bold'
                          : 'normal',
                      }
                    ]}>
                      {option}
                    </Text>
                    
                    {optIndex === detail.correctAnswer && (
                      <Text style={[
                        tw['text-xs'],
                        { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' }
                      ]}>
                        Correct
                      </Text>
                    )}
                    
                    {optIndex === detail.studentAnswer && !detail.isCorrect && (
                      <Text style={[
                        tw['text-xs'],
                        { color: '#f44336', fontSize: 12, fontWeight: 'bold' }
                      ]}>
                        Your Answer
                      </Text>
                    )}
                  </View>
                ))}
                
                {detail.explanation && (
                  <View style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}>
                    <Text style={[
                      tw['text-sm'],
                      { color: theme.colors.text, opacity: 0.8, fontSize: 14, lineHeight: 20 }
                    ]}>
                      <Text style={{ fontWeight: 'bold' }}>Explanation: </Text>
                      {detail.explanation}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ margin: 16, gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
            }}
            onPress={onGoToTests}
          >
            <Text style={[
              tw['text-base'],
              { color: 'white', fontSize: 16, fontWeight: 'bold' }
            ]}>
              Take More Tests
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
              Back to Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default TestResult;
