import { CURRENT_API_ENDPOINT } from '../config/network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { downloadAndInstallApk, DownloadProgress } from './inAppUpdateService';

export interface AppVersionInfo {
  currentVersion: string;
  latestVersion: string;
  downloadUrl?: string;
  forceUpdate: boolean;
  updateMessage?: string;
}

export interface UpdateHandlers {
  onProgress?: (progress: DownloadProgress) => void;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onInstallStart?: () => void;
  onError?: (error: string) => void;
}

export class VersionCheckService {
  private static readonly VERSION_CHECK_KEY = 'last_version_check';
  private static readonly SKIP_VERSION_KEY = 'skip_version';
  
  // Check if we should perform version check (once per day)
  static async shouldCheckVersion(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(this.VERSION_CHECK_KEY);
      if (!lastCheck) return true;
      
      const lastCheckTime = new Date(lastCheck);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastCheckTime.getTime()) / (1000 * 60 * 60);
      
      return hoursDiff >= 24; // Check once per day
    } catch (error) {
      console.log('Error checking version check time:', error);
      return true;
    }
  }
  
  // Get current app version
  static async getCurrentVersion(): Promise<string> {
    try {
      return await DeviceInfo.getVersion();
    } catch (error) {
      console.log('Error getting app version:', error);
      return '1.0.0';
    }
  }
  
  // Check for app updates
  static async checkForUpdates(): Promise<AppVersionInfo | null> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      const response = await fetch(`${CURRENT_API_ENDPOINT}/api/app/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch version info');
      }
      
      const versionData = await response.json();
      
      // Update last check time
      await AsyncStorage.setItem(this.VERSION_CHECK_KEY, new Date().toISOString());
      
      return {
        currentVersion,
        latestVersion: versionData.latestVersion,
        downloadUrl: versionData.downloadUrl,
        forceUpdate: versionData.forceUpdate || false,
        updateMessage: versionData.message || 'A new version is available!',
      };
    } catch (error) {
      console.log('Error checking for updates:', error);
      return null;
    }
  }
  
  // Compare version strings (e.g., "1.2.3" vs "1.2.4")
  static compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    const maxLength = Math.max(currentParts.length, latestParts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    
    return 0; // Versions are equal
  }
  
  // Check if user has skipped this version
  static async hasSkippedVersion(version: string): Promise<boolean> {
    try {
      const skippedVersion = await AsyncStorage.getItem(this.SKIP_VERSION_KEY);
      return skippedVersion === version;
    } catch (error) {
      return false;
    }
  }
  
  // Mark version as skipped
  static async skipVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SKIP_VERSION_KEY, version);
    } catch (error) {
      console.log('Error skipping version:', error);
    }
  }
  
  // Show update dialog
  static async showUpdateDialog(versionInfo: AppVersionInfo): Promise<void> {
    const { currentVersion, latestVersion, downloadUrl, forceUpdate, updateMessage } = versionInfo;
    
    // Check if user has skipped this version (only for non-force updates)
    if (!forceUpdate && await this.hasSkippedVersion(latestVersion)) {
      return;
    }
    
    const title = forceUpdate ? 'Update Required' : 'Update Available';
    const message = `${updateMessage}\n\nCurrent: ${currentVersion}\nLatest: ${latestVersion}`;
    
    if (forceUpdate) {
      // Force update - only show update button
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Update Now',
            onPress: () => this.handleUpdate(downloadUrl),
          },
        ],
        { cancelable: false }
      );
    } else {
      // Optional update - show update, skip, or remind later
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Skip This Version',
            style: 'cancel',
            onPress: () => this.skipVersion(latestVersion),
          },
          {
            text: 'Remind Later',
            onPress: () => {}, // Do nothing, will check again next time
          },
          {
            text: 'Update Now',
            onPress: () => this.handleUpdate(downloadUrl),
          },
        ]
      );
    }
  }
  
  // Handle update action with in-app download
  static async handleUpdateWithDownload(
    downloadUrl: string,
    version: string,
    handlers?: UpdateHandlers
  ): Promise<boolean> {
    try {
      if (!downloadUrl) {
        throw new Error('Download URL not provided');
      }

      handlers?.onDownloadStart?.();

      // Download APK with progress tracking
      const downloadResult = await downloadAndInstallApk({
        downloadUrl,
        version,
        onProgress: handlers?.onProgress
      });

      if (downloadResult) {
        handlers?.onDownloadComplete?.();
        handlers?.onInstallStart?.();
        return true;
      } else {
        throw new Error('Download failed');
      }

    } catch (error) {
      console.log('Error in handleUpdateWithDownload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      handlers?.onError?.(errorMessage);
      
      // Fallback to external download
      Alert.alert(
        'Download Failed',
        'In-app download failed. Would you like to download from external source?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download Externally', 
            onPress: () => this.handleUpdate(downloadUrl)
          }
        ]
      );
      return false;
    }
  }

  // Handle update action (fallback to external)
  static async handleUpdate(downloadUrl?: string): Promise<void> {
    if (downloadUrl) {
      try {
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          Alert.alert('Error', 'Cannot open download link');
        }
      } catch (error) {
        console.log('Error opening download URL:', error);
        Alert.alert('Error', 'Failed to open download link');
      }
    } else {
      // Fallback - open Play Store
      try {
        const packageName = await DeviceInfo.getBundleId();
        const playStoreUrl = `market://details?id=${packageName}`;
        const webUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
        
        const supported = await Linking.canOpenURL(playStoreUrl);
        if (supported) {
          await Linking.openURL(playStoreUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      } catch (error) {
        console.log('Error opening Play Store:', error);
        Alert.alert('Error', 'Please update from Play Store manually');
      }
    }
  }
  
  // Main function to check and handle updates
  static async checkAndHandleUpdates(): Promise<boolean> {
    try {
      // Check if we should perform version check
      if (!(await this.shouldCheckVersion())) {
        return false;
      }
      
      // Get version information
      const versionInfo = await this.checkForUpdates();
      if (!versionInfo) {
        return false;
      }
      
      // Compare versions
      const comparison = this.compareVersions(
        versionInfo.currentVersion,
        versionInfo.latestVersion
      );
      
      // If current version is older than latest
      if (comparison < 0) {
        await this.showUpdateDialog(versionInfo);
        return versionInfo.forceUpdate; // Return true if force update is required
      }
      
      return false;
    } catch (error) {
      console.log('Error in checkAndHandleUpdates:', error);
      return false;
    }
  }
}
