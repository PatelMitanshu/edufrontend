import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface InstallationGuideProps {
  fileName?: string;
  onOpenSettings?: () => void;
  onOpenDownloads?: () => void;
}

const InstallationGuide: React.FC<InstallationGuideProps> = ({
  fileName,
  onOpenSettings,
  onOpenDownloads,
}) => {
  const { theme } = useTheme();

  const openInstallSettings = () => {
    if (Platform.OS === 'android') {
      try {
        // Try to open the specific "Install unknown apps" settings
        Linking.openURL('android.settings.MANAGE_UNKNOWN_APP_SOURCES');
      } catch (error) {
        // Fallback to general app settings
        Linking.openSettings();
      }
    }
    onOpenSettings?.();
  };

  const openDownloadsFolder = () => {
    try {
      // Try to open Downloads folder directly
      Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download');
    } catch (error) {
      // Fallback to file manager
      try {
        Linking.openURL('content://com.android.documentsui/.MainActivity');
      } catch (fallbackError) {
        Alert.alert('Info', 'Please open your file manager and navigate to the Downloads folder.');
      }
    }
    onOpenDownloads?.();
  };

  const showDetailedHelp = () => {
    Alert.alert(
      'Detailed Installation Guide 📱',
      'Complete step-by-step process:\n\n' +
      '🔽 STEP 1: Find the APK\n' +
      '• APK file saved in Downloads folder\n' +
      (fileName ? `• File name: ${fileName}\n` : '') +
      '\n📱 STEP 2: Enable Installation\n' +
      '• Go to: Settings > Apps > Special access\n' +
      '• Tap: Install unknown apps\n' +
      '• Find this app and enable permission\n' +
      '\n⚡ STEP 3: Install Update\n' +
      '• Open Downloads folder\n' +
      '• Tap the APK file\n' +
      '• Tap Install button\n' +
      '• Follow prompts to complete\n\n' +
      '❗ If still blocked, check your security settings and ensure "Unknown sources" is allowed.',
      [
        { text: 'Open Settings', onPress: openInstallSettings },
        { text: 'Open Downloads', onPress: openDownloadsFolder },
        { text: 'Got it!' }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Installation Guide 📱
      </Text>
      
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
          🔽 Step 1: Download Complete
        </Text>
        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
          APK saved to Downloads folder
        </Text>
        {fileName && (
          <Text style={[styles.fileName, { color: theme.colors.primary }]}>
            📁 {fileName}
          </Text>
        )}
      </View>

      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
          📱 Step 2: Enable Permission
        </Text>
        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
          Allow "Install unknown apps" for this app
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={openInstallSettings}
        >
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
          ⚡ Step 3: Install Update
        </Text>
        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
          Open Downloads and tap APK file
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          onPress={openDownloadsFolder}
        >
          <Text style={styles.buttonText}>Open Downloads</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.helpButton, { borderColor: theme.colors.primary }]}
        onPress={showDetailedHelp}
      >
        <Text style={[styles.helpButtonText, { color: theme.colors.primary }]}>
          📋 Show Detailed Guide
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  helpButton: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  helpButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default InstallationGuide;
