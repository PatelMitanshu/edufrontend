import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentMCQService, MCQTest } from '../services/studentMCQService';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';

interface MCQTestListProps {
  studentId: string;
  onNavigateToTest: (testId: string, test: MCQTest) => void;
  onNavigateToHistory: (studentId: string) => void;
}

const MCQTestList: React.FC<MCQTestListProps> = ({
  studentId,
  onNavigateToTest,
  onNavigateToHistory,
}) => {
  const { theme } = useTheme();
  const [tests, setTests] = useState<MCQTest[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  const loadTests = async () => {
    try {
      const response = await studentMCQService.getAvailableTests(studentId);
      setTests(response.tests);
      setStudent(response.student);
    } catch (error) {Alert.alert('Error', 'Failed to load tests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [studentId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTests();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
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

  const availableTests = tests.filter(test => !test.hasAttempted);
  const completedTests = tests.filter(test => test.hasAttempted);

  if (loading) {
    return (
      <View style={[
        tw['flex-1'],
        { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[tw['text-base'], { color: theme.colors.text, marginTop: 16 }]}>
          Loading tests...
        </Text>
      </View>
    );
  }

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        <Text style={[
          tw['text-2xl'],
          tw['font-bold'],
          { color: theme.colors.text }
        ]}>
          MCQ Tests
        </Text>
        {student && (
          <Text style={[
            tw['text-base'],
            { color: theme.colors.textSecondary, marginTop: 4 }
          ]}>
            {student.name || 'Student'} • Standard {student.standard?.name || 'N/A'}
          </Text>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics */}
        <View style={{
          flexDirection: 'row',
          padding: 16,
          gap: 12,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <Icon name="assignment" size={24} color={theme.colors.primary} />
            <Text style={[
              tw['text-xl'],
              tw['font-bold'],
              { color: theme.colors.text, marginTop: 8 }
            ]}>
              {availableTests.length}
            </Text>
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.textSecondary }
            ]}>
              Available
            </Text>
          </View>
          
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
          }}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={[
              tw['text-xl'],
              tw['font-bold'],
              { color: theme.colors.text, marginTop: 8 }
            ]}>
              {completedTests.length}
            </Text>
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.textSecondary }
            ]}>
              Completed
            </Text>
          </View>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={() => onNavigateToHistory(studentId)}
          >
            <Icon name="history" size={24} color={theme.colors.primary} />
            <Text style={[
              tw['text-xs'],
              { color: theme.colors.text, marginTop: 8, textAlign: 'center' }
            ]}>
              View History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: theme.colors.text, marginBottom: 12 }
            ]}>
              Available Tests ({availableTests.length})
            </Text>
            {availableTests.map((test) => (
              <TouchableOpacity
                key={test._id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.primary,
                }}
                onPress={() => onNavigateToTest(test._id, test)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      tw['text-base'],
                      tw['font-bold'],
                      { color: theme.colors.text }
                    ]}>
                      {test.title}
                    </Text>
                    {test.description && (
                      <Text style={[
                        tw['text-sm'],
                        { color: theme.colors.textSecondary, marginTop: 4 }
                      ]}>
                        {test.description}
                      </Text>
                    )}
                  </View>
                  <Icon name="play-arrow" size={24} color={theme.colors.primary} />
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
                    <Icon name="quiz" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      tw['text-xs'],
                      { color: theme.colors.textSecondary, marginLeft: 4 }
                    ]}>
                      {test.questionsCount} Questions
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="schedule" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      tw['text-xs'],
                      { color: theme.colors.textSecondary, marginLeft: 4 }
                    ]}>
                      {formatTime(test.timeLimit)}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="calendar-today" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      tw['text-xs'],
                      { color: theme.colors.textSecondary, marginLeft: 4 }
                    ]}>
                      {formatDate(test.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Tests */}
        {completedTests.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: theme.colors.text, marginBottom: 12 }
            ]}>
              Completed Tests ({completedTests.length})
            </Text>
            {completedTests.map((test) => (
              <View
                key={test._id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: getGradeColor(test.grade || 'D'),
                  opacity: 0.8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      tw['text-base'],
                      tw['font-bold'],
                      { color: theme.colors.text }
                    ]}>
                      {test.title}
                    </Text>
                    {test.description && (
                      <Text style={[
                        tw['text-sm'],
                        { color: theme.colors.textSecondary, marginTop: 4 }
                      ]}>
                        {test.description}
                      </Text>
                    )}
                  </View>
                  <Icon name="check-circle" size={24} color="#4CAF50" />
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
                    <Text style={[
                      tw['text-sm'],
                      tw['font-bold'],
                      { color: getGradeColor(test.grade || 'D') }
                    ]}>
                      {test.grade} ({test.percentage}%)
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="schedule" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      tw['text-xs'],
                      { color: theme.colors.textSecondary, marginLeft: 4 }
                    ]}>
                      {test.timeTaken}
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="event" size={16} color={theme.colors.textSecondary} />
                    <Text style={[
                      tw['text-xs'],
                      { color: theme.colors.textSecondary, marginLeft: 4 }
                    ]}>
                      {test.completedAt ? formatDate(test.completedAt) : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {tests.length === 0 && (
          <View style={{
            padding: 32,
            alignItems: 'center',
          }}>
            <Icon name="assignment" size={64} color={theme.colors.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[
              tw['text-lg'],
              tw['font-bold'],
              { color: theme.colors.text, marginTop: 16 }
            ]}>
              No Tests Available
            </Text>
            <Text style={[
              tw['text-sm'],
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }
            ]}>
              Your teacher hasn't created any MCQ tests yet.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default MCQTestList;
