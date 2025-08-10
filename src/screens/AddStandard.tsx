import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { standardService } from '../services/standardService';
import { useTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStandard'>;

function AddStandard({ navigation }: Props) {
  const { theme } = useTheme();
  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const standards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleSubmit = async () => {
    if (!selectedStandard) {
      Alert.alert('Error', 'Please select a standard');
      return;
    }

    try {
      setLoading(true);
      
      const standardData = {
        name: `${selectedStandard}${getOrdinalSuffix(selectedStandard)} Standard`,
        description: `Standard ${selectedStandard} curriculum`
      };

      await standardService.createStandard(standardData);
      
      Alert.alert('Success', 'Standard created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create standard. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Add New Standard</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Select a standard from 1st to 12th
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Standard *</Text>
          
          <View style={styles.standardGrid}>
            {standards.map((standard) => (
              <TouchableOpacity
                key={standard}
                style={[
                  styles.standardCard,
                  {
                    backgroundColor: selectedStandard === standard 
                      ? theme.colors.primary 
                      : theme.colors.background,
                    borderColor: selectedStandard === standard 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  }
                ]}
                onPress={() => setSelectedStandard(standard)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.standardNumber,
                  {
                    color: selectedStandard === standard 
                      ? theme.colors.surface 
                      : theme.colors.text
                  }
                ]}>
                  {standard}
                </Text>
                <Text style={[
                  styles.standardSuffix,
                  {
                    color: selectedStandard === standard 
                      ? theme.colors.surface + '90'
                      : theme.colors.textSecondary
                  }
                ]}>
                  {getOrdinalSuffix(standard)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedStandard && (
            <View style={[styles.previewContainer, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                Preview:
              </Text>
              <Text style={[styles.previewText, { color: theme.colors.primary }]}>
                {selectedStandard}{getOrdinalSuffix(selectedStandard)} Standard
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedStandard ? theme.colors.primary : theme.colors.border,
                opacity: selectedStandard ? 1 : 0.5
              }
            ]}
            onPress={handleSubmit}
            disabled={!selectedStandard || loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.colors.surface }]}>
                Create Standard
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default AddStandard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  standardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  standardCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  standardNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  standardSuffix: {
    fontSize: 10,
    fontWeight: '500',
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
