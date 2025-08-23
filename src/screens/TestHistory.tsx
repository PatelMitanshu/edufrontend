import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentMCQService } from '../services/studentMCQService';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';

interface TestHistoryProps {
  studentId: string;
  onGoBack: () => void;
  onViewResult: (submissionId: string) => void;
}

const TestHistory: React.FC<TestHistoryProps> = ({
  studentId,
  onGoBack,
  onViewResult,
}) => {
  const { theme } = useTheme();
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTestHistory();
  }, [studentId]);

  const loadTestHistory = async () => {
    try {
      const response = await studentMCQService.getTestHistory(studentId);
      setTestHistory(response.testHistory);
    } catch (error) {Alert.alert('Error', 'Failed to load test history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTestHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const calculateAverage = () => {
    if (testHistory.length === 0) return 0;
    const total = testHistory.reduce((sum, test) => sum + test.percentage, 0);
    return (total / testHistory.length).toFixed(1);
  };

  const getBestScore = () => {
    if (testHistory.length === 0) return 0;
    return Math.max(...testHistory.map(test => test.percentage));
  };

  const getGradeDistribution = () => {
    const distribution = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
    testHistory.forEach(test => {
      if (test.grade in distribution) {
        distribution[test.grade as keyof typeof distribution]++;
      }
    });
    return distribution;
  };

  if (loading) {
    return (
      <View style={[
        tw['flex-1'],
        { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[tw['text-base'], { color: theme.colors.text, marginTop: 16 }]}>
          Loading test history...
        </Text>
      </View>
    );
  }

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
            Test History
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {testHistory.length > 0 && (
          <>
            {/* Statistics Overview */}
            <View style={{
              margin: 16,
              backgroundColor: theme.colors.card,
              borderRadius: 12,
              padding: 16,
            }}>
              <Text style={[
                tw['text-base'],
                { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 }
              ]}>
                Performance Overview
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[
                    tw['text-2xl'],
                    { color: theme.colors.primary, fontSize: 24, fontWeight: 'bold' }
                  ]}>
                    {testHistory.length}
                  </Text>
                  <Text style={[
                    tw['text-xs'],
                    { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
                  ]}>
                    Tests Taken
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={[
                    tw['text-2xl'],
                    { color: '#4CAF50', fontSize: 24, fontWeight: 'bold' }
                  ]}>
                    {calculateAverage()}%
                  </Text>
                  <Text style={[
                    tw['text-xs'],
                    { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
                  ]}>
                    Average Score
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={[
                    tw['text-2xl'],
                    { color: '#FF9800', fontSize: 24, fontWeight: 'bold' }
                  ]}>
                    {getBestScore()}%
                  </Text>
                  <Text style={[
                    tw['text-xs'],
                    { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
                  ]}>
                    Best Score
                  </Text>
                </View>
              </View>

              {/* Grade Distribution */}
              <View>
                <Text style={[
                  tw['text-sm'],
                  { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 }
                ]}>
                  Grade Distribution
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {Object.entries(getGradeDistribution()).map(([grade, count]) => (
                    <View key={grade} style={{ alignItems: 'center' }}>
                      <Text style={[
                        tw['text-base'],
                        { color: getGradeColor(grade), fontSize: 16, fontWeight: 'bold' }
                      ]}>
                        {count}
                      </Text>
                      <Text style={[
                        tw['text-xs'],
                        { color: theme.colors.text, opacity: 0.7, fontSize: 12 }
                      ]}>
                        {grade}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Test History List */}
            <View style={{ padding: 16 }}>
              <Text style={[
                tw['text-base'],
                { color: theme.colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }
              ]}>
                Recent Tests ({testHistory.length})
              </Text>
              
              {testHistory.map((test, index) => (
                <TouchableOpacity
                  key={test._id}
                  style={{
                    backgroundColor: theme.colors.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: getGradeColor(test.grade),
                  }}
                  onPress={() => onViewResult(test._id)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        tw['text-base'],
                        { color: theme.colors.text, fontSize: 16, fontWeight: 'bold' }
                      ]}>
                        {test.mcqTest.title}
                      </Text>
                      {test.mcqTest.description && (
                        <Text style={[
                          tw['text-sm'],
                          { color: theme.colors.text, opacity: 0.7, fontSize: 14, marginTop: 4 }
                        ]}>
                          {test.mcqTest.description}
                        </Text>
                      )}
                    </View>
                    
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[
                        tw['text-xl'],
                        {
                          color: getGradeColor(test.grade),
                          fontSize: 18,
                          fontWeight: 'bold'
                        }
                      ]}>
                        {test.grade}
                      </Text>
                      <Text style={[
                        tw['text-sm'],
                        { color: theme.colors.text, fontSize: 14, opacity: 0.8 }
                      ]}>
                        {test.percentage}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="check-circle" size={16} color="#4CAF50" />
                      <Text style={[
                        tw['text-xs'],
                        { color: theme.colors.text, opacity: 0.7, fontSize: 12, marginLeft: 4 }
                      ]}>
                        {test.correctAnswers}/{test.totalQuestions} correct
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="schedule" size={16} color={theme.colors.text} style={{ opacity: 0.7 }} />
                      <Text style={[
                        tw['text-xs'],
                        { color: theme.colors.text, opacity: 0.7, fontSize: 12, marginLeft: 4 }
                      ]}>
                        {test.timeTaken}
                      </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Icon name="calendar-today" size={16} color={theme.colors.text} style={{ opacity: 0.7 }} />
                      <Text style={[
                        tw['text-xs'],
                        { color: theme.colors.text, opacity: 0.7, fontSize: 12, marginLeft: 4 }
                      ]}>
                        {formatDate(test.completedAt)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={{
                    marginTop: 12,
                    height: 4,
                    backgroundColor: theme.colors.border,
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      width: `${test.percentage}%`,
                      height: '100%',
                      backgroundColor: getGradeColor(test.grade),
                    }} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {testHistory.length === 0 && (
          <View style={{
            padding: 32,
            alignItems: 'center',
          }}>
            <Icon name="history" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[
              tw['text-lg'],
              { color: theme.colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16 }
            ]}>
              No Test History
            </Text>
            <Text style={[
              tw['text-sm'],
              { color: theme.colors.text, opacity: 0.7, fontSize: 14, textAlign: 'center', marginTop: 8 }
            ]}>
              You haven't taken any tests yet. Start taking tests to see your progress here.
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
              <Text style={[tw['text-base'], { color: 'white' }]}>
                Take Your First Test
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default TestHistory;
