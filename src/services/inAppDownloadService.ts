import RNFS from 'react-native-fs';
import { Alert, Linking, Platform } from 'react-native';

export interface DownloadProgress {
  progressPercent: number;
  bytesWritten: number;
  contentLength: number;
}

/**
 * Downloads and installs an APK file on Android
 */
export async function downloadAndInstallApk({
  downloadUrl,
  version,
  onProgress
}: {
  downloadUrl: string;
  version: string;
  onProgress?: (progress: DownloadProgress) => void;
}): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // For iOS, just redirect to App Store
    Alert.alert(
      'Update Available',
      'Please update through the App Store.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open App Store', 
          onPress: () => Linking.openURL(downloadUrl)
        }
      ]
    );
    return false;
  }

  try {
    // Generate filename
    const fileName = `edulearn-${version}.apk`;
    const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    // Check if file already exists and delete it
    if (await RNFS.exists(downloadPath)) {
      await RNFS.unlink(downloadPath);
    }

    Alert.alert('Download Started', `Downloading update v${version}...`);

    // Start download
    const download = RNFS.downloadFile({
      fromUrl: downloadUrl,
      toFile: downloadPath,
      progress: onProgress ? (res) => {
        const progressPercent = (res.bytesWritten / res.contentLength) * 100;
        const progress: DownloadProgress = {
          progressPercent,
          bytesWritten: res.bytesWritten,
          contentLength: res.contentLength
        };
        onProgress(progress);
      } : undefined,
    });

    const result = await download.promise;

    if (result.statusCode === 200) {
      Alert.alert(
        'Download Complete',
        `Update v${version} downloaded successfully!\n\nFile saved to: Downloads/${fileName}\n\nPlease tap "Install" when the installation screen appears.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Install Now', 
            onPress: () => installApk(downloadPath)
          }
        ]
      );
      return true;
    } else {
      throw new Error(`Download failed with status: ${result.statusCode}`);
    }

  } catch (error) {
    console.error('Download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert(
      'Download Failed',
      `Failed to download update: ${errorMessage}\n\nYou can download manually from: ${downloadUrl}`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Open Browser', 
          onPress: () => Linking.openURL(downloadUrl)
        }
      ]
    );
    return false;
  }
}

/**
 * Attempts to install an APK file
 */
async function installApk(filePath: string): Promise<void> {
  try {
    // Check if we can install unknown apps
    const canInstall = await canInstallApps();
    
    if (!canInstall) {
      Alert.alert(
        'Installation Permission Required',
        'Please enable "Install unknown apps" permission for this app to install updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => openInstallSettings()
          }
        ]
      );
      return;
    }

    // Use file:// protocol for Android file URIs
    const fileUri = `file://${filePath}`;
    
    // Try to open the APK file for installation
    const canOpen = await Linking.canOpenURL(fileUri);
    if (canOpen) {
      await Linking.openURL(fileUri);
    } else {
      // Fallback: show file location
      Alert.alert(
        'Manual Installation Required',
        `Please manually install the APK file from:\n${filePath}\n\nYou can find it in your Downloads folder.`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Installation error:', error);
    Alert.alert(
      'Installation Error',
      'Could not start installation. Please manually install the downloaded APK file from your Downloads folder.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Checks if the app can install unknown apps (Android 8+)
 */
export async function canInstallApps(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  
  try {
    // For Android 8+, check install permission
    if (Platform.Version >= 26) {
      // This would require native module implementation
      // For now, we'll assume permission is needed and guide user
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking install permission:', error);
    return false;
  }
}

/**
 * Opens Android settings for install unknown apps permission
 */
export function openInstallSettings(): void {
  if (Platform.OS === 'android') {
    // Open app settings where user can enable "Install unknown apps"
    Linking.openSettings();
  }
}
