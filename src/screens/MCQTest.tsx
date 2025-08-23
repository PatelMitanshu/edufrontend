import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { standardService } from '../services/standardService';
import { mcqService } from '../services/mcqService';

type RootStackParamList = {
  MCQTest: undefined;
  CreateMCQ: { standardId: string; standardName: string };
  MCQPreview: { mcqData: any; standardId: string; standardName: string; testId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'MCQTest'>;

interface Standard {
  _id: string;
  name: string;
  mcqTestCount?: number;
}

interface MCQTest {
  _id: string;
  title: string;
  description: string;
  questionsCount: number;
  createdAt: string;
  standardId: string;
}

export default function MCQTest({ navigation }: Props) {
  const { theme } = useTheme();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  const [mcqTests, setMcqTests] = useState<MCQTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);

  useEffect(() => {
    loadStandards();
  }, []);

  useEffect(() => {
    // Reload standards when returning to this screen to show updated test counts
    const unsubscribe = navigation.addListener('focus', () => {
      loadStandards();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStandards = async () => {
    try {
      setLoading(true);
      const response = await standardService.getStandards();
      const standardsData = response.standards || [];
      
      // Load MCQ test counts for each standard
      const standardsWithCounts = await Promise.all(
        standardsData.map(async (standard) => {
          try {
            const tests = await mcqService.getMCQTests(standard._id);
            return { ...standard, mcqTestCount: tests.length };
          } catch (error) {return { ...standard, mcqTestCount: 0 };
          }
        })
      );
      
      setStandards(standardsWithCounts);
    } catch (error) {Alert.alert('Error', 'Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  const loadMCQTests = async (standardId: string) => {
    try {
      setTestsLoading(true);
      const tests = await mcqService.getMCQTests(standardId);
      setMcqTests(tests);
    } catch (error) {Alert.alert('Error', 'Failed to load MCQ tests');
    } finally {
      setTestsLoading(false);
    }
  };

  const handleStandardPress = (standard: Standard) => {
    setSelectedStandard(standard);
    setShowTestsModal(true);
    loadMCQTests(standard._id);
  };

  const handleCreateNewTest = () => {
    if (selectedStandard) {
      setShowTestsModal(false);
      navigation.navigate('CreateMCQ', {
        standardId: selectedStandard._id,
        standardName: selectedStandard.name,
      });
    }
  };

  const handleDeleteTest = async (testId: string, testTitle: string) => {
    Alert.alert(
      'Delete MCQ Test',
      `Are you sure you want to delete "${testTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mcqService.deleteMCQTest(testId);
              Alert.alert('Success', 'MCQ test deleted successfully');
              // Reload tests for the current standard
              if (selectedStandard) {
                loadMCQTests(selectedStandard._id);
                // Also reload standards to update test count
                loadStandards();
              }
            } catch (error) {Alert.alert('Error', 'Failed to delete MCQ test');
            }
          },
        },
      ]
    );
  };

  const handleViewTest = async (testId: string) => {
    try {
      const testData = await mcqService.getMCQTest(testId);
      setShowTestsModal(false);
      navigation.navigate('MCQPreview', { 
        mcqData: testData.questions || [],
        standardId: testData.standardId,
        standardName: selectedStandard?.name || 'Unknown Standard',
        testId: testId // Include testId to indicate this is an existing test
      });
    } catch (error) {Alert.alert('Error', 'Failed to load test details');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStandards();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStandardCard = ({ item: standard }: { item: Standard }) => (
    <TouchableOpacity
      style={[
        tw['bg-white'],
        tw['rounded-xl'],
        tw['p-6'],
        tw['mb-4'],
        tw['mx-4'],
        tw['shadow-lg'],
        {
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: theme.colors.primary,
        },
      ]}
      onPress={() => handleStandardPress(standard)}
      activeOpacity={0.7}
    >
      <View style={[tw['flex-row'], tw['items-center'], tw['justify-between']]}>
        <View style={[tw['flex-1']]}>
          <Text
            style={[
              tw['text-xl'],
              tw['font-bold'],
              tw['mb-2'],
              { color: theme.colors.text },
            ]}
          >
            Standard {standard.name}
          </Text>
          <Text
            style={[
              tw['text-sm'],
              tw['mb-3'],
              { color: theme.colors.textSecondary },
            ]}
          >
            {standard.mcqTestCount || 0} MCQ tests
          </Text>
          <View style={[tw['flex-row'], tw['items-center']]}>
            <View
              style={[
                tw['w-8'],
                tw['h-8'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                tw['mr-2'],
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Text style={[tw['text-sm'], { color: theme.colors.primary }]}>
                �
              </Text>
            </View>
            <Text
              style={[
                tw['text-sm'],
                tw['font-medium'],
                { color: theme.colors.primary },
              ]}
            >
              Manage MCQ Tests
            </Text>
          </View>
        </View>
        <View
          style={[
            tw['w-12'],
            tw['h-12'],
            tw['rounded-full'],
            tw['items-center'],
            tw['justify-center'],
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={[tw['text-lg'], { color: theme.colors.surface }]}>
            →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen />;
  }

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
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' as never }],
            })}
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
            MCQ Test Manager
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
          Manage and create AI-powered MCQ tests
        </Text>
      </View>

      {/* Content */}
      <View style={[tw['flex-1'], { paddingTop: 24 }]}>
        <Text
          style={[
            tw['text-lg'],
            tw['font-semibold'],
            tw['px-6'],
            tw['mb-4'],
            { color: theme.colors.text },
          ]}
        >
          Select Standard to Manage MCQ Tests
        </Text>

        {standards.length === 0 ? (
          <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], tw['px-6']]}>
            <Text style={[tw['text-6xl'], tw['mb-4']]}>📚</Text>
            <Text
              style={[
                tw['text-lg'],
                tw['font-semibold'],
                tw['mb-2'],
                tw['text-center'],
                { color: theme.colors.text },
              ]}
            >
              No Standards Available
            </Text>
            <Text
              style={[
                tw['text-sm'],
                tw['text-center'],
                { color: theme.colors.textSecondary },
              ]}
            >
              Please add standards first to create MCQ tests
            </Text>
          </View>
        ) : (
          <FlatList
            data={standards}
            renderItem={renderStandardCard}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[{ paddingBottom: 24 }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
      </View>

      {/* MCQ Tests Modal */}
      <Modal
        visible={showTestsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTestsModal(false)}
      >
        <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
          {/* Modal Header */}
          <View
            style={[
              tw['px-6'],
              tw['py-4'],
              tw['flex-row'],
              tw['items-center'],
              tw['justify-between'],
              { paddingTop: 48, backgroundColor: theme.colors.primary },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowTestsModal(false)}
              style={[
                tw['w-10'],
                tw['h-10'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Icon name="close" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
            <Text
              style={[
                tw['text-lg'],
                tw['font-bold'],
                { color: theme.colors.surface },
              ]}
            >
              {selectedStandard ? `Standard ${selectedStandard.name}` : 'MCQ Tests'}
            </Text>
            <TouchableOpacity
              onPress={handleCreateNewTest}
              style={[
                tw['w-10'],
                tw['h-10'],
                tw['rounded-full'],
                tw['items-center'],
                tw['justify-center'],
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Icon name="add" size={20} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <View style={[tw['flex-1'], tw['px-6'], tw['py-4']]}>
            <Text
              style={[
                tw['text-sm'],
                tw['mb-4'],
                { color: theme.colors.textSecondary },
              ]}
            >
              {mcqTests.length} MCQ test{mcqTests.length !== 1 ? 's' : ''} available
            </Text>

            {testsLoading ? (
              <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={[
                    tw['text-sm'],
                    tw['mt-2'],
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Loading tests...
                </Text>
              </View>
            ) : mcqTests.length === 0 ? (
              <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
                <Text style={[tw['text-6xl'], tw['mb-4']]}>📝</Text>
                <Text
                  style={[
                    tw['text-lg'],
                    tw['font-semibold'],
                    tw['mb-2'],
                    tw['text-center'],
                    { color: theme.colors.text },
                  ]}
                >
                  No MCQ Tests Created
                </Text>
                <Text
                  style={[
                    tw['text-sm'],
                    tw['text-center'],
                    tw['mb-4'],
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Create your first MCQ test by taking a photo of your textbook
                </Text>
                <TouchableOpacity
                  onPress={handleCreateNewTest}
                  style={[
                    tw['px-6'],
                    tw['py-3'],
                    tw['rounded-full'],
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      tw['text-sm'],
                      tw['font-semibold'],
                      { color: theme.colors.surface },
                    ]}
                  >
                    Create New Test
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={testsLoading}
                    onRefresh={() => selectedStandard && loadMCQTests(selectedStandard._id)}
                    colors={[theme.colors.primary]}
                  />
                }
              >
                {mcqTests.map((test) => (
                  <View
                    key={test._id}
                    style={[
                      tw['bg-white'],
                      tw['rounded-xl'],
                      tw['p-4'],
                      tw['mb-3'],
                      tw['shadow-sm'],
                      {
                        backgroundColor: theme.colors.surface,
                        borderLeftWidth: 4,
                        borderLeftColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <View style={[tw['flex-row'], tw['items-center'], tw['justify-between']]}>
                      <View style={[tw['flex-1'], tw['mr-3']]}>
                        <Text
                          style={[
                            tw['text-lg'],
                            tw['font-bold'],
                            tw['mb-1'],
                            { color: theme.colors.text },
                          ]}
                        >
                          {test.title}
                        </Text>
                        {test.description && (
                          <Text
                            style={[
                              tw['text-sm'],
                              tw['mb-2'],
                              { color: theme.colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {test.description}
                          </Text>
                        )}
                        <View style={[tw['flex-row'], tw['items-center'], tw['flex-wrap']]}>
                          <View style={[tw['flex-row'], tw['items-center'], tw['mr-4']]}>
                            <Icon name="quiz" size={14} color={theme.colors.primary} />
                            <Text
                              style={[
                                tw['text-xs'],
                                { color: theme.colors.textSecondary, marginLeft: 4 },
                              ]}
                            >
                              {test.questionsCount} questions
                            </Text>
                          </View>
                          <View style={[tw['flex-row'], tw['items-center']]}>
                            <Icon name="schedule" size={14} color={theme.colors.primary} />
                            <Text
                              style={[
                                tw['text-xs'],
                                { color: theme.colors.textSecondary, marginLeft: 4 },
                              ]}
                            >
                              {formatDate(test.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={[tw['flex-row'], tw['items-center']]}>
                        <TouchableOpacity
                          onPress={() => handleViewTest(test._id)}
                          style={[
                            tw['w-8'],
                            tw['h-8'],
                            tw['rounded-full'],
                            tw['items-center'],
                            tw['justify-center'],
                            tw['mr-2'],
                            { backgroundColor: theme.colors.primary + '20' },
                          ]}
                        >
                          <Icon name="visibility" size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteTest(test._id, test.title)}
                          style={[
                            tw['w-8'],
                            tw['h-8'],
                            tw['rounded-full'],
                            tw['items-center'],
                            tw['justify-center'],
                            { backgroundColor: '#ff4444' + '20' },
                          ]}
                        >
                          <Icon name="delete" size={16} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
