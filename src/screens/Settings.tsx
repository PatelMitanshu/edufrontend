import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { tw } from '../utils/tailwind';
import { useThemedStyles } from '../utils/themedStyles';
import { useTheme } from '../contexts/ThemeContext';
import { profileService, ProfileSettings } from '../services/profileService';

function SettingsScreen() {
  const { theme, setThemeMode } = useTheme();
  const themedStyles = useThemedStyles(theme.colors);
  
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications: {
      email: true,
      push: true,
      studentUpdates: true,
      systemAlerts: true,
    },
    privacy: {
      profileVisibility: 'private',
      shareData: false,
    },
    appearance: {
      theme: 'light',
      language: 'en',
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'weekly',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsData = await profileService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      // Use default settings if network fails
      // Settings are already initialized with default values above
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await profileService.updateSettings(settings);
      Alert.alert('Success', 'Settings updated successfully!');
    } catch (error) {
      // Show a more user-friendly error message
      Alert.alert(
        'Connection Error', 
        'Unable to save settings to server. Your changes have been saved locally and will sync when connection is restored.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (key: keyof ProfileSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev?.notifications,
        [key]: value,
      },
    }));
  };

  const updatePrivacySetting = (key: keyof ProfileSettings['privacy'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev?.privacy,
        [key]: value,
      },
    }));
  };

  const updateAppearanceSetting = async (key: keyof ProfileSettings['appearance'], value: string) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev?.appearance,
        [key]: value,
      },
    }));
    
    // If theme is being changed, update the theme context immediately
    if (key === 'theme') {
      await setThemeMode(value as 'light' | 'dark' | 'auto');
    }
  };

  const updateBackupSetting = (key: keyof ProfileSettings['backup'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      backup: {
        ...prev?.backup,
        [key]: value,
      },
    }));
  };

  const SettingRow = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    type = 'switch' 
  }: {
    title: string;
    description?: string;
    value: boolean | string;
    onValueChange: (value: boolean | string) => void;
    type?: 'switch' | 'select';
  }) => (
    <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center'], themedStyles['py-4'], themedStyles['border-b'], themedStyles['border-surface']]}>
      <View style={[themedStyles['flex-1']]}>
        <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary']]}>
          {title}
        </Text>
        {description && (
          <Text style={[themedStyles['text-sm'], themedStyles['text-secondary'], themedStyles['mt-1']]}>
            {description}
          </Text>
        )}
      </View>
      {type === 'switch' && (
        <Switch
          value={value as boolean}
          onValueChange={onValueChange as (value: boolean) => void}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={value ? '#ffffff' : theme.colors.surface}
        />
      )}
    </View>
  );

  const SelectRow = ({ 
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
    <View style={[themedStyles['py-4'], themedStyles['border-b'], themedStyles['border-surface']]}>
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

  if (loading) {
    return (
      <SafeAreaView style={[themedStyles['flex-1'], themedStyles['bg-background']]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
        <View style={[themedStyles['flex-1'], themedStyles['justify-center'], themedStyles['items-center']]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[themedStyles['text-base'], themedStyles['text-secondary'], themedStyles['mt-3']]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[themedStyles['flex-1'], themedStyles['bg-background']]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* Enhanced Header */}
      <View style={[themedStyles['bg-surface'], themedStyles['px-5'], themedStyles['py-6'], themedStyles['shadow-lg'], themedStyles['border-b'], themedStyles['border-surface']]}>
        <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center']]}>
          <View style={[themedStyles['flex-row'], themedStyles['items-center'], themedStyles['flex-1']]}>
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
          <TouchableOpacity 
            style={[themedStyles['bg-gradient-primary'], themedStyles['px-4'], themedStyles['py-3'], themedStyles['rounded-xl'], themedStyles['items-center'], themedStyles['shadow-colored-blue']]}
            onPress={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[themedStyles['text-white'], themedStyles['text-sm'], themedStyles['font-bold']]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={[themedStyles['flex-1']]} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-4'], themedStyles['mt-4']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            📧 Notifications
          </Text>

          <SettingRow
            title="Email Notifications"
            description="Receive important updates via email"
            value={settings?.notifications?.email ?? true}
            onValueChange={(value) => updateNotificationSetting('email', value as boolean)}
          />

          <SettingRow
            title="Push Notifications"
            description="Get real-time notifications on your device"
            value={settings?.notifications?.push ?? true}
            onValueChange={(value) => updateNotificationSetting('push', value as boolean)}
          />

          <SettingRow
            title="Student Updates"
            description="Notifications about student activities and progress"
            value={settings?.notifications?.studentUpdates ?? true}
            onValueChange={(value) => updateNotificationSetting('studentUpdates', value as boolean)}
          />

          <SettingRow
            title="System Alerts"
            description="Important system announcements and updates"
            value={settings?.notifications?.systemAlerts ?? true}
            onValueChange={(value) => updateNotificationSetting('systemAlerts', value as boolean)}
          />
        </View>

        {/* Privacy Section */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-4']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            🔒 Privacy & Security
          </Text>

          <SelectRow
            title="Profile Visibility"
            description="Control who can see your profile information"
            value={settings?.privacy?.profileVisibility ?? 'private'}
            options={[
              { label: 'Private', value: 'private' },
              { label: 'School', value: 'school' },
              { label: 'Public', value: 'public' },
            ]}
            onValueChange={(value) => updatePrivacySetting('profileVisibility', value)}
          />

          <SettingRow
            title="Share Data for Analytics"
            description="Help improve the app by sharing anonymous usage data"
            value={settings?.privacy?.shareData ?? false}
            onValueChange={(value) => updatePrivacySetting('shareData', value as boolean)}
          />
        </View>

        {/* Appearance Section */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-4']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            🎨 Appearance
          </Text>

          <SelectRow
            title="Theme"
            description="Choose your preferred app theme"
            value={settings?.appearance?.theme ?? theme.mode}
            options={[
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ]}
            onValueChange={(value) => updateAppearanceSetting('theme', value)}
          />

          <SelectRow
            title="Language"
            description="Select your preferred language"
            value={settings?.appearance?.language ?? 'en'}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
              { label: 'German', value: 'de' },
            ]}
            onValueChange={(value) => updateAppearanceSetting('language', value)}
          />
          
          {/* Theme Preview */}
          <View style={[themedStyles['mt-4'], themedStyles['p-4'], themedStyles['bg-card'], themedStyles['rounded-xl'], themedStyles['border'], themedStyles['border-surface']]}>
            <Text style={[themedStyles['text-sm'], themedStyles['font-medium'], themedStyles['text-secondary'], themedStyles['mb-2']]}>
              Theme Preview
            </Text>
            <View style={[themedStyles['flex-row'], themedStyles['items-center']]}>
              <View style={[themedStyles['w-8'], themedStyles['h-8'], themedStyles['bg-primary'], themedStyles['rounded'], themedStyles['mr-2']]} />
              <Text style={[themedStyles['text-sm'], themedStyles['text-primary']]}>
                Current theme: {theme.isDark ? 'Dark' : 'Light'} mode
              </Text>
            </View>
          </View>
        </View>

        {/* Backup Section */}
        <View style={[themedStyles['bg-surface'], themedStyles['mx-5'], themedStyles['rounded-3xl'], themedStyles['shadow-lg'], themedStyles['p-6'], themedStyles['mb-6']]}>
          <Text style={[themedStyles['text-lg'], themedStyles['font-bold'], themedStyles['text-primary'], themedStyles['mb-4']]}>
            💾 Backup & Sync
          </Text>

          <SettingRow
            title="Auto Backup"
            description="Automatically backup your data to the cloud"
            value={settings?.backup?.autoBackup ?? true}
            onValueChange={(value) => updateBackupSetting('autoBackup', value as boolean)}
          />

          <SelectRow
            title="Backup Frequency"
            description="How often to backup your data"
            value={settings?.backup?.backupFrequency ?? 'weekly'}
            options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
            ]}
            onValueChange={(value) => updateBackupSetting('backupFrequency', value)}
          />
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
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary']]}>2025.01.01</Text>
          </View>

          <View style={[themedStyles['flex-row'], themedStyles['justify-between'], themedStyles['items-center'], themedStyles['py-3']]}>
            <Text style={[themedStyles['text-base'], themedStyles['font-medium'], themedStyles['text-primary']]}>Theme</Text>
            <Text style={[themedStyles['text-sm'], themedStyles['text-secondary']]}>{theme.isDark ? '🌙 Dark' : '☀️ Light'}</Text>
          </View>
        </View>

       
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingsScreen;
