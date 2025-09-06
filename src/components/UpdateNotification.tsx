import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { tw } from '../utils/tailwind';
import { DownloadProgress } from '../services/inAppUpdateService';

interface UpdateNotificationProps {
  visible: boolean;
  currentVersion: string;
  latestVersion: string;
  updateMessage: string;
  forceUpdate: boolean;
  onUpdate: () => void;
  onSkip?: () => void;
  onRemindLater?: () => void;
  isUpdating?: boolean;
  downloadProgress?: DownloadProgress | null;
  isDownloading?: boolean;
}

const { width, height } = Dimensions.get('window');

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  visible,
  currentVersion,
  latestVersion,
  updateMessage,
  forceUpdate,
  onUpdate,
  onSkip,
  onRemindLater,
  isUpdating = false,
  downloadProgress = null,
  isDownloading = false,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!forceUpdate) {
          onRemindLater?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          { backgroundColor: theme.colors.surface }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[
              styles.title,
              { color: theme.colors.text },
              forceUpdate && styles.forceUpdateTitle
            ]}>
              {forceUpdate ? '🚨 Update Required' : '🔄 Update Available'}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.message, { color: theme.colors.text }]}>
              {updateMessage}
            </Text>

            {/* Version Info */}
            <View style={styles.versionContainer}>
              <View style={styles.versionRow}>
                <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                  Current Version:
                </Text>
                <Text style={[styles.versionValue, { color: theme.colors.text }]}>
                  {currentVersion}
                </Text>
              </View>
              <View style={styles.versionRow}>
                <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                  Latest Version:
                </Text>
                <Text style={[styles.versionValue, { color: theme.colors.primary }]}>
                  {latestVersion}
                </Text>
              </View>
            </View>

            {forceUpdate && (
              <View style={styles.forceUpdateNotice}>
                <Text style={[styles.forceUpdateText, { color: theme.colors.error }]}>
                  ⚠️ This update is required to continue using the app
                </Text>
              </View>
            )}

            {/* Download Progress */}
            {isDownloading && downloadProgress && (
              <View style={styles.downloadProgressContainer}>
                <Text style={[styles.downloadTitle, { color: theme.colors.text }]}>
                  📥 Downloading Update...
                </Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  {Platform.OS === 'android' ? (
                    <ProgressBarAndroid
                      styleAttr="Horizontal"
                      indeterminate={false}
                      progress={downloadProgress.progressPercent / 100}
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                  ) : (
                    <View style={[styles.progressBarIOS, { backgroundColor: theme.colors.border }]}>
                      <View 
                        style={[
                          styles.progressBarIOSFill, 
                          { 
                            backgroundColor: theme.colors.primary,
                            width: `${downloadProgress.progressPercent}%`
                          }
                        ]} 
                      />
                    </View>
                  )}
                </View>

                {/* Progress Text */}
                <View style={styles.progressTextContainer}>
                  <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                    {Math.round(downloadProgress.progressPercent)}% completed
                  </Text>
                  <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                    {formatFileSize(downloadProgress.bytesWritten)} / {formatFileSize(downloadProgress.contentLength)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {forceUpdate ? (
              // Force update - only show update button
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  { backgroundColor: theme.colors.primary },
                  isUpdating && styles.disabledButton
                ]}
                onPress={onUpdate}
                disabled={isUpdating}
              >
                {isUpdating || isDownloading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.updateButtonText}>
                      {isDownloading ? 'Downloading...' : 'Installing...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.updateButtonText}>Download & Install</Text>
                )}
              </TouchableOpacity>
            ) : (
              // Optional update - show all options
              <>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                  onPress={onSkip}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                    Skip This Version
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                  onPress={onRemindLater}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                    Remind Me Later
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    { backgroundColor: theme.colors.primary },
                    isUpdating && styles.disabledButton
                  ]}
                  onPress={onUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating || isDownloading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.updateButtonText}>
                        {isDownloading ? 'Downloading...' : 'Installing...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.updateButtonText}>Download & Install</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(width - 40, 400),
    borderRadius: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  forceUpdateTitle: {
    color: '#dc2626',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  versionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  forceUpdateNotice: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  forceUpdateText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  updateButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadProgressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  downloadTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressBarIOS: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarIOSFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default UpdateNotification;
