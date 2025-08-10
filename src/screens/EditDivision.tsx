import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import LoadingScreen from '../components/LoadingScreen';
import { divisionService, Division } from '../services/divisionService';
import { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'EditDivision'>;

export default function EditDivision({ route, navigation }: Props) {
  const { divisionId } = route.params;
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [division, setDivision] = useState<Division | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Division',
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.surface,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    loadDivision();
  }, [divisionId, theme, navigation]);

  const loadDivision = async () => {
    try {
      setLoading(true);
      const response = await divisionService.getDivision(divisionId);
      setDivision(response.division);
      setName(response.division.name);
      setDescription(response.division.description || '');
    } catch (error) {
      console.error('Error loading division:', error);
      Alert.alert('Error', 'Failed to load division details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Division name is required');
      return;
    }

    if (name.length > 10) {
      Alert.alert('Error', 'Division name must be 10 characters or less');
      return;
    }

    try {
      setSaving(true);
      await divisionService.updateDivision(divisionId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      Alert.alert(
        'Success',
        'Division updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating division:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update division';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (name !== division?.name || description !== (division?.description || '')) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!division) {
    return (
      <View style={[tw['flex-1'], tw['justify-center'], tw['items-center'], { backgroundColor: theme.colors.background }]}>
        <Text style={[tw['text-lg'], { color: theme.colors.text }]}>Division not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[tw['flex-1']]} showsVerticalScrollIndicator={false}>
        <View style={[tw['p-6']]}>
          {/* Division Info Header */}
          <View style={[
            tw['p-6'], 
            tw['rounded-2xl'], 
            tw['mb-6'],
            { backgroundColor: theme.colors.primary }
          ]}>
            <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-center'], tw['mb-2'], { color: theme.colors.surface }]}>
              Edit Division
            </Text>
            <Text style={[tw['text-lg'], tw['text-center'], { color: theme.colors.surface, opacity: 0.8 }]}>
              {division.standard.name} - {division.name}
            </Text>
            <Text style={[tw['text-sm'], tw['text-center'], tw['mt-1'], { color: theme.colors.surface, opacity: 0.7 }]}>
              {division.studentCount} student{division.studentCount !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={[tw['mb-6']]}>
            {/* Division Name */}
            <View style={[tw['mb-6']]}>
              <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-2'], { color: theme.colors.text }]}>
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
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                  }
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter division name (e.g., A, B, C)"
                placeholderTextColor={theme.colors.textSecondary}
                maxLength={10}
                autoCapitalize="characters"
              />
              <Text style={[tw['text-xs'], tw['mt-1'], { color: theme.colors.textSecondary }]}>
                Division name (max 10 characters)
              </Text>
            </View>

            {/* Description */}
            <View>
              <Text style={[tw['text-base'], tw['font-semibold'], tw['mb-2'], { color: theme.colors.text }]}>
                Description (Optional)
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
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                    minHeight: 100,
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter division description (optional)"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={[tw['text-xs'], tw['mt-1'], { color: theme.colors.textSecondary }]}>
                {description.length}/200 characters
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[tw['flex-row'], tw['mt-6'], { gap: 16 }]}>
            <TouchableOpacity
              style={[
                tw['flex-1'],
                tw['py-4'],
                tw['rounded-xl'],
                tw['items-center'],
                {
                  backgroundColor: theme.colors.surface,
                  borderWidth: 2,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw['flex-1'],
                tw['py-4'],
                tw['rounded-xl'],
                tw['items-center'],
                {
                  backgroundColor: saving ? theme.colors.textSecondary : theme.colors.primary,
                }
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[tw['text-base'], tw['font-semibold'], { color: theme.colors.surface }]}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
