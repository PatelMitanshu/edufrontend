import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import { VersionCheckService, AppVersionInfo, UpdateHandlers } from '../services/versionCheckService';
import { DownloadProgress } from '../services/inAppUpdateService';
import UpdateNotification from '../components/UpdateNotification';
import { showInstallPermissionGuide } from '../utils/installPermissionGuide';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckUpdate'>;

function CheckUpdate({ navigation }: Props) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    loadCurrentVersion();
    loadLastChecked();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await DeviceInfo.getVersion();
      setCurrentVersion(version);
    } catch (error) {
      console.error('Error getting app version:', error);
    }
  };

  const loadLastChecked = async () => {
    try {
      const lastCheck = await VersionCheckService.shouldCheckVersion();
      if (!lastCheck) {
        setLastChecked('Today');
      } else {
        setLastChecked('Not checked recently');
      }
    } catch (error) {
      console.error('Error loading last check:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsLoading(true);
    try {
      const updateInfo = await VersionCheckService.checkForUpdates();
      
      if (updateInfo) {
        setVersionInfo(updateInfo);
        setLastChecked('Just now');
        
        const comparison = VersionCheckService.compareVersions(
          updateInfo.currentVersion,
          updateInfo.latestVersion
        );
        
        if (comparison < 0) {
          // Update available
          setShowUpdateModal(true);
        } else {
          // No update available
          Alert.alert(
            'No Updates Available',
            'You are already using the latest version of the app.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Check Failed',
          'Unable to check for updates. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert(
        'Update Check Error',
        'An error occurred while checking for updates. Please try again later.\n\nIf this persists, check your network connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!versionInfo) return;
    
    const handlers: UpdateHandlers = {
      onDownloadStart: () => {
        console.log('📥 Download started');
        setIsDownloading(true);
        setDownloadProgress(null);
      },
      onProgress: (progress) => {
        console.log(`📊 Download progress: ${Math.round(progress.progressPercent)}%`);
        setDownloadProgress(progress);
      },
      onDownloadComplete: () => {
        console.log('✅ Download completed');
        setIsDownloading(false);
        setIsUpdating(true);
      },
      onInstallStart: () => {
        console.log('📦 Installation started');
        setIsUpdating(true);
      },
      onError: (error) => {
        console.log('❌ Update error:', error);
        setIsDownloading(false);
        setIsUpdating(false);
        setDownloadProgress(null);
      }
    };

    try {
      const success = await VersionCheckService.handleUpdateWithDownload(
        versionInfo.downloadUrl || '',
        versionInfo.latestVersion,
        handlers
      );
      
      if (success) {
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.log('Error handling update:', error);
      handlers.onError?.('Update failed');
    }
  };

  const handleSkipUpdate = async () => {
    if (!versionInfo) return;
    
    await VersionCheckService.skipVersion(versionInfo.latestVersion);
    setShowUpdateModal(false);
  };

  const handleRemindLater = () => {
    setShowUpdateModal(false);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    handleCheckForUpdates().finally(() => {
      setRefreshing(false);
    });
  }, []);

  const getStatusColor = () => {
    if (!versionInfo) return theme.colors.textSecondary;
    
    const comparison = VersionCheckService.compareVersions(
      versionInfo.currentVersion,
      versionInfo.latestVersion
    );
    
    return comparison < 0 ? theme.colors.error : theme.colors.success;
  };

  const getStatusText = () => {
    if (!versionInfo) return 'Not checked';
    
    const comparison = VersionCheckService.compareVersions(
      versionInfo.currentVersion,
      versionInfo.latestVersion
    );
    
    return comparison < 0 ? 'Update Available' : 'Up to Date';
  };

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[tw['px-6'], tw['py-4'], tw['border-b'], { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}
        >
          <Text style={[tw['text-lg'], tw['mr-2'], { color: theme.colors.primary }]}>←</Text>
          <Text style={[tw['text-base'], { color: theme.colors.primary }]}>Back</Text>
        </TouchableOpacity>
        
        <Text style={[tw['text-2xl'], tw['font-bold'], { color: theme.colors.text }]}>
          Check for Updates
        </Text>
        <Text style={[tw['text-sm'], tw['mt-1'], { color: theme.colors.textSecondary }]}>
          Keep your app up to date with the latest features
        </Text>
      </View>

      <ScrollView
        style={[tw['flex-1']]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Version Card */}
        <View style={[tw['mx-6'], tw['mt-6'], tw['p-6'], tw['rounded-xl'], tw['shadow-lg'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}> 
            <View style={[tw['w-12'], tw['h-12'], tw['rounded-xl'], tw['items-center'], tw['justify-center'], tw['mr-4'], { backgroundColor: theme.colors.primary }]}>
              <Text style={[tw['text-xl'], tw['text-white']]}>📱</Text>
            </View>
            <View style={[tw['flex-1']]}>
              <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.text }]}>
                Current Version
              </Text>
              <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>
                Installed on your device
              </Text>
            </View>
          </View>
          
          <Text style={[tw['text-3xl'], tw['font-bold'], tw['text-center'], { color: theme.colors.primary }]}>
            v{currentVersion}
          </Text>
        </View>

        {/* Version Status Card */}
        <View style={[tw['mx-6'], tw['mt-4'], tw['p-6'], tw['rounded-xl'], tw['shadow-lg'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['mb-4']]}>
            <View style={[tw['flex-row'], tw['items-center']]}>
              <View style={[tw['w-12'], tw['h-12'], tw['rounded-xl'], tw['items-center'], tw['justify-center'], tw['mr-4'], { backgroundColor: getStatusColor() }]}>
                <Text style={[tw['text-xl'], tw['text-white']]}>
                  {versionInfo && VersionCheckService.compareVersions(versionInfo.currentVersion, versionInfo.latestVersion) < 0 ? '🔄' : '✅'}
                </Text>
              </View>
              <View>
                <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.text }]}>
                  Update Status
                </Text>
                <Text style={[tw['text-sm'], { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>
          
          {versionInfo && (
            <View style={[tw['mt-4'], tw['p-4'], tw['rounded-lg'], { backgroundColor: theme.colors.background }]}>
              <View style={[tw['flex-row'], tw['justify-between'], tw['mb-2']]}>
                <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Latest Version:</Text>
                <Text style={[tw['text-sm'], tw['font-bold'], { color: theme.colors.text }]}>v{versionInfo.latestVersion}</Text>
              </View>
              <View style={[tw['flex-row'], tw['justify-between']]}>
                <Text style={[tw['text-sm'], { color: theme.colors.textSecondary }]}>Last Checked:</Text>
                <Text style={[tw['text-sm'], { color: theme.colors.text }]}>{lastChecked}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Check for Updates Button */}
        <View style={[tw['mx-6'], tw['mt-6']]}>
          <TouchableOpacity
            style={[
              tw['py-4'], 
              tw['px-6'], 
              tw['rounded-xl'], 
              tw['shadow-lg'],
              tw['flex-row'],
              tw['items-center'],
              tw['justify-center'],
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleCheckForUpdates}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" style={[tw['mr-2']]} />
                <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold']]}>
                  Checking...
                </Text>
              </>
            ) : (
              <>
                <Text style={[tw['text-xl'], tw['mr-2']]}>🔍</Text>
                <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold']]}>
                  Check for Updates
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Information Card */}
        <View style={[tw['mx-6'], tw['mt-6'], tw['mb-6'], tw['p-6'], tw['rounded-xl'], tw['shadow-lg'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
            <Text style={[tw['text-xl'], tw['mr-3']]}>💡</Text>
            <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.text }]}>
              Update Information
            </Text>
          </View>
          
          <Text style={[tw['text-sm'], tw['leading-5'], { color: theme.colors.textSecondary }]}>
            • Updates include new features, bug fixes, and security improvements{'\n'}
            • You'll be notified automatically when updates are available{'\n'}
            • Manual checks help ensure you have the latest version{'\n'}
            • Updates are downloaded securely from the official source
          </Text>
        </View>

        {/* Installation Guide Card */}
        <View style={[tw['mx-6'], tw['mb-6'], tw['p-6'], tw['rounded-xl'], tw['shadow-lg'], { backgroundColor: theme.colors.surface }]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['mb-4']]}>
            <Text style={[tw['text-xl'], tw['mr-3']]}>📱</Text>
            <Text style={[tw['text-lg'], tw['font-bold'], { color: theme.colors.text }]}>
              Installation Guide
            </Text>
          </View>
          
          <View style={[tw['space-y-3']]}>
            <View style={[tw['flex-row'], tw['items-center']]}>
              <Text style={[tw['text-sm'], tw['font-bold'], tw['mr-2'], { color: theme.colors.primary }]}>1.</Text>
              <Text style={[tw['text-sm'], tw['leading-5'], tw['flex-1'], { color: theme.colors.textSecondary }]}>
                When update downloads, tap "Install Now"
              </Text>
            </View>
            
            <View style={[tw['flex-row'], tw['items-center']]}>
              <Text style={[tw['text-sm'], tw['font-bold'], tw['mr-2'], { color: theme.colors.primary }]}>2.</Text>
              <Text style={[tw['text-sm'], tw['leading-5'], tw['flex-1'], { color: theme.colors.textSecondary }]}>
                If blocked, tap "Settings" → Enable "Allow from this source"
              </Text>
            </View>
            
            <View style={[tw['flex-row'], tw['items-center']]}>
              <Text style={[tw['text-sm'], tw['font-bold'], tw['mr-2'], { color: theme.colors.primary }]}>3.</Text>
              <Text style={[tw['text-sm'], tw['leading-5'], tw['flex-1'], { color: theme.colors.textSecondary }]}>
                Return and tap "Install" to complete the update
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[tw['mt-4'], tw['p-3'], tw['rounded-lg'], tw['border'], { borderColor: theme.colors.primary }]}
            onPress={showInstallPermissionGuide}
          >
            <Text style={[tw['text-center'], tw['text-sm'], tw['font-bold'], { color: theme.colors.primary }]}>
              🔧 Enable Install Permission
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[tw['mt-2'], tw['p-3'], tw['rounded-lg'], tw['border'], { borderColor: theme.colors.textSecondary }]}
            onPress={() => {
              Alert.alert(
                'Installation Help 📱',
                'Need help with installation?\n\n' +
                '🔧 Enable "Install unknown apps":\n' +
                '   Settings → Apps → Special access → Install unknown apps → Find EduLearn → Enable\n\n' +
                '📁 Manual installation:\n' +
                '   Downloads folder → Find APK file → Tap to install\n\n' +
                '❓ Still having issues?\n' +
                '   Check device storage space and try again',
                [
                  { text: 'Open Settings', onPress: () => {
                    try {
                      Linking.openURL('android.settings.MANAGE_UNKNOWN_APP_SOURCES');
                    } catch (error) {
                      Linking.openSettings();
                    }
                  }},
                  { text: 'OK' }
                ]
              );
            }}
          >
            <Text style={[tw['text-center'], tw['text-sm'], tw['font-bold'], { color: theme.colors.textSecondary }]}>
              📋 Show Detailed Help
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Update Notification Modal */}
      {versionInfo && (
        <UpdateNotification
          visible={showUpdateModal}
          currentVersion={versionInfo.currentVersion}
          latestVersion={versionInfo.latestVersion}
          updateMessage={versionInfo.updateMessage || 'A new version is available!'}
          forceUpdate={versionInfo.forceUpdate}
          onUpdate={handleUpdate}
          onSkip={versionInfo.forceUpdate ? undefined : handleSkipUpdate}
          onRemindLater={versionInfo.forceUpdate ? undefined : handleRemindLater}
          isUpdating={isUpdating}
          downloadProgress={downloadProgress}
          isDownloading={isDownloading}
        />
      )}
    </SafeAreaView>
  );
}

export default CheckUpdate;
