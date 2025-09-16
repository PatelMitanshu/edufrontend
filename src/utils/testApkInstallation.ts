// Test script for APK update installation
// This script can be used to test the update flow in development

import { Platform, Alert } from 'react-native';
import { downloadAndInstallApk } from '../services/inAppUpdateService';

export const testApkInstallation = async () => {
  if (Platform.OS !== 'android') {
    Alert.alert('Test Info', 'APK installation testing is only available on Android devices.');
    return;
  }

  // Test with a dummy APK URL (replace with your actual APK URL)
  const testConfig = {
    downloadUrl: 'https://github.com/PatelMitanshu/edufrontend/releases/latest/download/app-release.apk',
    version: '1.9.0',
    onProgress: (progress: any) => {
      console.log(`Download Progress: ${progress.progressPercent.toFixed(1)}%`);
      console.log(`Downloaded: ${(progress.bytesWritten / 1024 / 1024).toFixed(1)} MB`);
      console.log(`Total: ${(progress.contentLength / 1024 / 1024).toFixed(1)} MB`);
    }
  };

  try {
    Alert.alert(
      'Test APK Installation',
      'This will test the APK download and installation process. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Download', 
          onPress: async () => {
            console.log('Starting test APK download...');
            const success = await downloadAndInstallApk(testConfig);
            console.log('Test download result:', success);
          }
        }
      ]
    );
  } catch (error) {
    console.error('Test failed:', error);
    Alert.alert('Test Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const testPermissionCheck = () => {
  // Test the permission checking logic
  const androidVersion = Platform.Version;
  
  Alert.alert(
    'Permission Info',
    `Android Version: ${androidVersion}\n\n` +
    `For Android 8.0+ (API 26+), the app needs "Install unknown apps" permission.\n\n` +
    'This permission is granted per-app and can be found in:\n' +
    'Settings > Apps > Special access > Install unknown apps',
    [
      { text: 'OK' }
    ]
  );
};

export const showInstallationTips = () => {
  Alert.alert(
    'Installation Tips 💡',
    'Common installation issues and solutions:\n\n' +
    '❌ "Install blocked" error:\n' +
    '   → Enable "Install unknown apps" permission\n\n' +
    '❌ "App not installed" error:\n' +
    '   → Clear space on device\n' +
    '   → Uninstall old version first\n\n' +
    '❌ Download fails:\n' +
    '   → Check internet connection\n' +
    '   → Check storage space\n\n' +
    '✅ Successful installation:\n' +
    '   → APK opens installation screen\n' +
    '   → Follow Android prompts\n' +
    '   → App updates automatically',
    [
      { text: 'Got it!' }
    ]
  );
};
