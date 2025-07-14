import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { tw } from '../utils/tailwind';
import { useThemedStyles } from '../utils/themedStyles';
import { useTheme } from '../contexts/ThemeContext';

function SettingsScreen() {
  const { theme, setThemeMode } = useTheme();
  const themedStyles = useThemedStyles(theme.colors);

  const updateTheme = async (themeValue: string) => {
    await setThemeMode(themeValue as 'light' | 'dark' | 'auto');
  };

  const ThemeSelectRow = ({ 
    title, 
    description, 
    value, 
    options, 
    onValueChange 
  }: {
    title: string;
    description?: string;
    value: string;
    options: { label: string; value: string }[];
    onValueChange: (value: string) => void;
  }) => (
    <View style={[themedStyles['py-4']]}>
      <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary'], themedStyles['mb-2']]}>
        {title}
      </Text>
      {description && (
        <Text style={[themedStyles['text-sm'], themedStyles['text-secondary'], themedStyles['mb-3']]}>
          {description}
        </Text>
      )}
      <View style={[themedStyles['flex-row'], themedStyles['flex-wrap']]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              themedStyles['px-4'], 
              themedStyles['py-2'], 
              themedStyles['rounded-lg'], 
              themedStyles['mr-2'], 
              themedStyles['mb-2'],
              value === option.value ? themedStyles['bg-primary'] : themedStyles['bg-card']
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              themedStyles['text-sm'], 
              themedStyles['font-medium'],
              value === option.value ? themedStyles['text-white'] : themedStyles['text-secondary']
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[themedStyles['flex-1'], themedStyles['bg-background']]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* Enhanced Header */}
      <View style={[themedStyles['bg-surface'], themedStyles['px-5'], themedStyles['py-6'], themedStyles['shadow-lg'], themedStyles['border-b'], themedStyles['border-surface']]}>
        <View style={[themedStyles['flex-row'], themedStyles['items-center']]}>
          <View style={[themedStyles['w-12'], themedStyles['h-12'], themedStyles['bg-gradient-primary'], themedStyles['rounded-full'], themedStyles['items-center'], themedStyles['justify-center'], themedStyles['mr-3'], themedStyles['shadow-colored-blue']]}>
            <Text style={[themedStyles['text-xl'], themedStyles['text-white']]}>⚙️</Text>
          </View>
          <View>
            <Text style={[themedStyles['text-xl'], themedStyles['font-extrabold'], themedStyles['text-primary-500'], themedStyles['tracking-wide']]}>
              Settings
            </Text>
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary'], themedStyles['font-medium']]}>
              Configure your preferences
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={[themedStyles['flex-1']]} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-4'], themedStyles['mt-4']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            🎨 Theme
          </Text>

          <ThemeSelectRow
            title="App Theme"
            description="Choose your preferred app appearance"
            value={theme.mode}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ]}
            onValueChange={updateTheme}
          />
          
          {/* Theme Preview */}
          <View style={[themedStyles['mt-4'], themedStyles['p-4'], themedStyles['bg-card'], themedStyles['rounded-xl'], themedStyles['border'], themedStyles['border-surface']]}>
            <Text style={[themedStyles['text-sm'], themedStyles['font-medium'], themedStyles['text-secondary'], themedStyles['mb-2']]}>
              Current Theme
            </Text>
            <View style={[themedStyles['flex-row'], themedStyles['items-center']]}>
              <View style={[themedStyles['w-8'], themedStyles['h-8'], themedStyles['bg-primary'], themedStyles['rounded'], themedStyles['mr-2']]} />
              <Text style={[themedStyles['text-sm'], themedStyles['text-primary']]}>
                {theme.isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
            </View>
          </View>
        </View>

        {/* App Information */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-6']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            ℹ️ App Information
          </Text>

          <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center'], themedStyles['py-3']]}>
            <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary']]}>Version</Text>
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary']]}>1.0.0</Text>
          </View>

          <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center'], themedStyles['py-3']]}>
            <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary']]}>Build</Text>
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary']]}>2025.07.14</Text>
          </View>

          <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center'], themedStyles['py-3']]}>
            <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary']]}>Current Theme</Text>
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary']]}>{theme.isDark ? '🌙 Dark' : '☀️ Light'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingsScreen;
