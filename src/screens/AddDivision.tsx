import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { divisionService, CreateDivisionData } from '../services/divisionService';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'AddDivision'>;

export default function AddDivision({ route, navigation }: Props) {
  const { standardId, standardName } = route.params;
  const { theme } = useTheme();
  
  const [formData, setFormData] = useState<CreateDivisionData>({
    name: '',
    description: '',
    standardId,
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      title: `Add Division to ${standardName}`,
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.surface,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [standardName, theme]);

  const handleInputChange = (field: keyof CreateDivisionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Division name is required');
      return false;
    }

    if (formData.name.trim().length > 10) {
      Alert.alert('Validation Error', 'Division name must be 10 characters or less');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await divisionService.createDivision({
        ...formData,
        name: formData.name.trim().toUpperCase(),
      });

      Alert.alert('Success', 'Division created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating division:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create division';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const previewName = formData.name.trim() ? `${standardName}-${formData.name.trim().toUpperCase()}` : '';

  return (
    <KeyboardAvoidingView 
      style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[tw['flex-grow'], tw['p-6']]}>
        <View style={[tw['mb-6']]}>
          <Text style={[tw['text-lg'], tw['font-semibold'], tw['mb-2'], { color: theme.colors.text }]}>
            Standard: {standardName}
          </Text>
          <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
            Create a new division for this standard
          </Text>
        </View>

        {/* Division Name */}
        <View style={[tw['mb-6']]}>
          <Text style={[tw['text-base'], tw['font-medium'], tw['mb-2'], { color: theme.colors.text }]}>
            Division Name *
          </Text>
          <TextInput
            style={[
              tw['px-4'],
              tw['py-3'],
              tw['rounded-xl'],
              tw['text-base'],
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: theme.colors.primary + '20',
              }
            ]}
            placeholder="e.g., A, B, C, Alpha, Beta..."
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            maxLength={10}
            autoCapitalize="characters"
          />
          <Text style={[tw['text-xs'], tw['mt-1'], { color: theme.colors.textSecondary }]}>
            Division names are automatically converted to uppercase
          </Text>
        </View>

        {/* Preview */}
        {previewName && (
          <View style={[
            tw['mb-6'],
            tw['p-4'],
            tw['rounded-xl'],
            { backgroundColor: theme.colors.primary + '10' }
          ]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['mb-1'], { color: theme.colors.text }]}>
              Preview:
            </Text>
            <Text style={[tw['text-xl'], tw['font-bold'], { color: theme.colors.primary }]}>
              {previewName}
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={[tw['mb-6']]}>
          <Text style={[tw['text-base'], tw['font-medium'], tw['mb-2'], { color: theme.colors.text }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[
              tw['px-4'],
              tw['py-3'],
              tw['rounded-xl'],
              tw['text-base'],
              tw['h-24'],
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderWidth: 1,
                borderColor: theme.colors.primary + '20',
                textAlignVertical: 'top',
              }
            ]}
            placeholder="Add a description for this division..."
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            maxLength={500}
          />
          <Text style={[tw['text-xs'], tw['mt-1'], { color: theme.colors.textSecondary }]}>
            {(formData.description || '').length}/500 characters
          </Text>
        </View>

        {/* Common Division Examples */}
        <View style={[tw['mb-6']]}>
          <Text style={[tw['text-base'], tw['font-medium'], tw['mb-3'], { color: theme.colors.text }]}>
            Quick Suggestions:
          </Text>
          <View style={[tw['flex-row'], tw['flex-wrap']]}>
            {['A', 'B', 'C', 'D', 'Alpha', 'Beta'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[
                  tw['px-3'],
                  tw['py-2'],
                  tw['rounded-full'],
                  tw['mr-2'],
                  tw['mb-2'],
                  { backgroundColor: theme.colors.surface }
                ]}
                onPress={() => handleInputChange('name', suggestion)}
              >
                <Text style={[tw['text-sm'], { color: theme.colors.primary }]}>
                  {standardName}-{suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            tw['py-4'],
            tw['rounded-xl'],
            tw['items-center'],
            {
              backgroundColor: formData.name.trim() ? theme.colors.primary : theme.colors.primary + '50',
            }
          ]}
          onPress={handleSubmit}
          disabled={!formData.name.trim() || loading}
        >
          <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>
            Create Division
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
