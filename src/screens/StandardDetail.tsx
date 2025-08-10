import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { Division, divisionService } from '../services/divisionService';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'StandardDetail'>;

export default function StandardDetail({ route, navigation }: Props) {
  const { standardId, standardName } = route.params;
  const { theme } = useTheme();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: standardName,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.surface,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={handleAddDivision}
          style={[
            tw['px-4'],
            tw['py-2'],
            tw['rounded-full'],
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={[tw['text-sm'], tw['font-semibold'], { color: theme.colors.primary }]}>
            Add Division
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [standardId, standardName, theme]);

  useFocusEffect(
    React.useCallback(() => {
      loadDivisions();
    }, [standardId])
  );

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const response = await divisionService.getDivisionsByStandard(standardId);
      setDivisions(response.divisions || []);
    } catch (error: any) {
      console.error('Error loading divisions:', error);
      // If it's a 404 or network error, show empty state instead of error
      if (error.response?.status === 404 || error.response?.data?.error === 'Standard not found') {
        setDivisions([]);
      } else {
        // Only show error alert for actual errors, not empty states
        const errorMessage = error.response?.data?.error || 'Failed to load divisions';
        Alert.alert('Error', errorMessage);
        setDivisions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDivisions();
    setRefreshing(false);
  };

  const handleAddDivision = () => {
    navigation.navigate('AddDivision', { standardId, standardName });
  };

  const handleDivisionPress = (division: Division) => {
    navigation.navigate('DivisionDetail', { 
      divisionId: division._id, 
      divisionName: division.fullName,
      standardId: division.standard._id,
      standardName: division.standard.name
    });
  };

  const handleDivisionLongPress = (division: Division) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Division', 'Delete Division'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: `"${division.fullName}"`,
          message: 'What would you like to do with this division?',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            navigation.navigate('EditDivision', { divisionId: division._id });
          } else if (buttonIndex === 2) {
            confirmDeleteDivision(division);
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        'Division Options',
        `What would you like to do with "${division.fullName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => navigation.navigate('EditDivision', { divisionId: division._id }) },
          { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteDivision(division) }
        ]
      );
    }
  };

  const confirmDeleteDivision = (division: Division) => {
    Alert.alert(
      'Delete Division',
      `Are you sure you want to delete "${division.fullName}"?\n\nThis action cannot be undone. All students in this division will also be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDivision(division) }
      ]
    );
  };

  const deleteDivision = async (division: Division) => {
    try {
      await divisionService.deleteDivision(division._id);
      setDivisions(divisions.filter(d => d._id !== division._id));
      Alert.alert('Success', `"${division.fullName}" has been deleted successfully.`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete division. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const renderDivisionCard = ({ item }: { item: Division }) => (
    <TouchableOpacity
      style={[
        tw['flex-row'], 
        tw['items-center'], 
        tw['p-4'], 
        tw['mb-3'], 
        tw['rounded-xl'],
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={() => handleDivisionPress(item)}
      onLongPress={() => handleDivisionLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        tw['w-16'], 
        tw['h-16'], 
        tw['rounded-xl'], 
        tw['items-center'], 
        tw['justify-center'], 
        tw['mr-4'],
        { backgroundColor: theme.colors.primary }
      ]}>
        <Text style={[tw['text-2xl'], tw['font-bold'], { color: theme.colors.surface }]}>
          {item.name}
        </Text>
      </View>
      <View style={[tw['flex-1']]}>
        <Text style={[tw['text-xl'], tw['font-semibold'], tw['mb-1'], { color: theme.colors.text }]}>
          {item.fullName}
        </Text>
        <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
          {item.studentCount} student{item.studentCount !== 1 ? 's' : ''}
        </Text>
        {item.description && (
          <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <View style={[tw['w-6'], tw['items-center']]}>
        <Text style={[tw['text-lg'], { color: theme.colors.textSecondary }]}>→</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      {divisions.length === 0 ? (
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], tw['p-8']]}>
          <View style={[
            tw['w-24'], 
            tw['h-24'], 
            tw['rounded-full'], 
            tw['items-center'], 
            tw['justify-center'], 
            tw['mb-6'],
            { backgroundColor: theme.colors.surface }
          ]}>
            <Text style={[tw['text-4xl']]}>📚</Text>
          </View>
          <Text style={[tw['text-xl'], tw['font-bold'], tw['mb-2'], tw['text-center'], { color: theme.colors.text }]}>
            No Divisions Yet
          </Text>
          <Text style={[tw['text-base'], tw['text-center'], tw['mb-6'], { color: theme.colors.textSecondary }]}>
            Create divisions (like {standardName}-A, {standardName}-B) to organize your students better.
          </Text>
          <TouchableOpacity
            style={[
              tw['px-6'], 
              tw['py-3'], 
              tw['rounded-full'],
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleAddDivision}
          >
            <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>
              Create First Division
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={divisions}
          renderItem={renderDivisionCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[tw['p-4']]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
