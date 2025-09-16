import { Alert, Linking } from 'react-native';

// Manual Test Guide for Install Permission
// Use this in your CheckUpdate screen to help users find the permission

export const showInstallPermissionGuide = () => {
  Alert.alert(
    'How to Enable Install Permission 🔧',
    'The "Install unknown apps" permission is found in different places on different Android versions:\n\n' +
    '📱 METHOD 1 (Most common):\n' +
    'Settings → Apps → Special access → Install unknown apps → EduLearn → Enable\n\n' +
    '📱 METHOD 2 (Some devices):\n' +
    'Settings → Security → Install unknown apps → EduLearn → Enable\n\n' +
    '📱 METHOD 3 (Older Android):\n' +
    'Settings → Security → Unknown sources → Enable\n\n' +
    '💡 TIP: Search for "install" or "unknown" in your device settings if you can\'t find it.',
    [
      { text: 'Try Method 1', onPress: () => tryOpenInstallSettings() },
      { text: 'Try Method 2', onPress: () => tryOpenSecuritySettings() },
      { text: 'OK' }
    ]
  );
};

const tryOpenInstallSettings = async () => {
  try {
    await Linking.openURL('android.settings.MANAGE_UNKNOWN_APP_SOURCES');
  } catch (error) {
    Alert.alert('Info', 'This method is not available on your device. Try Method 2 or search manually.');
  }
};

const tryOpenSecuritySettings = async () => {
  try {
    await Linking.openURL('android.settings.SECURITY_SETTINGS');
  } catch (error) {
    Alert.alert('Info', 'Opening general settings. Look for Security or Apps section.');
    Linking.openSettings();
  }
};

// Test function to check which URLs work on the device
export const testSettingsUrls = async () => {
  const urls = [
    'android.settings.MANAGE_UNKNOWN_APP_SOURCES',
    'android.settings.SECURITY_SETTINGS', 
    'android.settings.APPLICATION_SETTINGS',
    'android.settings.SETTINGS'
  ];
  
  console.log('Testing settings URLs...');
  
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      console.log(`${url}: ${canOpen ? '✅ Available' : '❌ Not available'}`);
    } catch (error) {
      console.log(`${url}: ❌ Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};