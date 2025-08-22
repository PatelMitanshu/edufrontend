import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FileViewerProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: string;
  fileName: string;
  mimeType: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  visible,
  onClose,
  fileUrl,
  fileType,
  fileName,
  mimeType,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOpeningVideo, setIsOpeningVideo] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  // Debug logging
        // Reset error state when props change
  React.useEffect(() => {
    setError(false);
    setLoading(true);
    setRetryCount(0);
  }, [fileUrl, mimeType]);

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  
  // Enhanced document detection to support more file types
  const isDocument = mimeType.includes('pdf') || 
                    mimeType.includes('document') || 
                    mimeType.includes('text') ||
                    mimeType.includes('spreadsheet') ||
                    mimeType.includes('presentation') ||
                    mimeType.includes('excel') ||
                    mimeType.includes('word') ||
                    mimeType.includes('powerpoint') ||
                    mimeType.includes('vnd.ms-') ||
                    mimeType.includes('vnd.openxml') ||
                    mimeType.includes('vnd.google-apps') ||
                    mimeType.includes('opendocument') ||
                    mimeType.includes('rtf') ||
                    mimeType.includes('csv');
  
  // Check if it's a Google Apps file
  const isGoogleAppsFile = mimeType.includes('vnd.google-apps');
  
  // Check if it's an Excel/Spreadsheet file
  const isSpreadsheet = mimeType.includes('spreadsheet') || 
                       mimeType.includes('excel') || 
                       mimeType.includes('csv') ||
                       mimeType.includes('vnd.ms-excel') ||
                       mimeType.includes('vnd.openxmlformats-officedocument.spreadsheetml');

  const handleError = () => {
    setError(true);
    setLoading(false);
    Alert.alert('Error', 'Failed to load file. Please try again.');
  };

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load file</Text>
          <Text style={styles.errorSubtext}>The file might be corrupted or unavailable</Text>
        </View>
      );
    }

    if (isImage) {
      return (
        <View style={styles.imageContainer}>
          <ScrollView
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            pinchGestureEnabled={true}
            scrollEnabled={true}
            bouncesZoom={true}
            centerContent={true}
            contentContainerStyle={styles.imageContentContainer}
          >
            <Image
              source={{ uri: fileUrl }}
              style={styles.image}
              resizeMode="contain"
              onError={handleError}
              onLoad={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
            />
          </ScrollView>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading image...</Text>
            </View>
          )}
        </View>
      );
    }

    if (isVideo) {
      const tryOpenVideo = async (attempt = 0) => {
        setIsOpeningVideo(true);
        setOpenError(null);
        try {
          if (Platform.OS === 'android') {
            const videoIntent = `intent:${fileUrl}#Intent;type=video/*;scheme=https;end`;
            const canOpenIntent = await Linking.canOpenURL(videoIntent);
            if (canOpenIntent) {
              await Linking.openURL(videoIntent);
              setIsOpeningVideo(false);
              return;
            }
          }
          // Fallback: open direct URL
          const canOpenDirect = await Linking.canOpenURL(fileUrl);
          if (!canOpenDirect) throw new Error('No app available to open this video URL');
          await Linking.openURL(fileUrl);
          setIsOpeningVideo(false);
        } catch (err: any) {
          // If the video is still processing on the server, retry a couple of times
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            return tryOpenVideo(attempt + 1);
          }
          setIsOpeningVideo(false);
          setOpenError('Video might still be processing. Please try again in a moment.');
        }
      };
      return (
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎥</Text>
            <Text style={styles.videoText}>Video File</Text>
            <Text style={styles.videoSubtext}>
              {openError ? openError : 'Tap to open in external player'}
            </Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => tryOpenVideo(0)}
              disabled={isOpeningVideo}
            >
              <Text style={styles.openButtonText}>{isOpeningVideo ? 'Opening…' : 'Open Video'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (isDocument) {
      return (
        <View style={styles.documentContainer}>
          {mimeType.includes('pdf') ? (
            // For PDFs, use Google Docs Viewer
            <View style={styles.pdfContainer}>
              <WebView
                source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` }}
                style={styles.webview}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  setError(true);
                }}
                onLoad={() => setLoading(false)}
                onLoadStart={() => setLoading(true)}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
              {error && (
                <View style={styles.pdfFallback}>
                  <Text style={styles.pdfFallbackText}>PDF Preview Not Available</Text>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => {
                      Linking.openURL(fileUrl).catch(() => {
                        Alert.alert('Error', 'Could not open PDF');
                      });
                    }}
                  >
                    <Text style={styles.openButtonText}>Open PDF Externally</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : isGoogleAppsFile ? (
            // For Google Apps files (Docs, Sheets, Slides), open directly
            <View style={styles.googleAppsContainer}>
              <Text style={styles.googleAppsIcon}>📊</Text>
              <Text style={styles.googleAppsText}>Google {
                mimeType.includes('spreadsheet') ? 'Sheets' :
                mimeType.includes('document') ? 'Docs' :
                mimeType.includes('presentation') ? 'Slides' : 'Apps'
              } File</Text>
              <Text style={styles.googleAppsSubtext}>Tap to open in Google Apps or browser</Text>
              <TouchableOpacity
                style={styles.openButton}
                onPress={() => {
                  Linking.openURL(fileUrl).catch(() => {
                    Alert.alert('Error', 'Could not open Google Apps file. Please ensure you have Google Apps installed or a web browser.');
                  });
                }}
              >
                <Text style={styles.openButtonText}>Open Google File</Text>
              </TouchableOpacity>
            </View>
          ) : isSpreadsheet ? (
            // For Excel and other spreadsheet files, try multiple viewing methods
            <View style={styles.spreadsheetContainer}>
              {!error ? (
                <WebView
                  source={{ 
                    uri: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
                  }}
                  style={styles.webview}
                  onError={(syntheticEvent) => {
                                        // Try Google Docs Viewer as fallback
                    const fallbackUri = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
                                        setError(true);
                  }}
                  onHttpError={(syntheticEvent) => {
                                        setError(true);
                  }}
                  onLoad={() => {
                                        setLoading(false);
                  }}
                  onLoadStart={() => setLoading(true)}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              ) : (
                // Fallback to Google Docs Viewer
                <WebView
                  source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` }}
                  style={styles.webview}
                  onError={(syntheticEvent) => {
                                        // This will show the final fallback UI
                  }}
                  onLoad={() => {
                                        setLoading(false);
                    setError(false); // Reset error since fallback worked
                  }}
                  onLoadStart={() => setLoading(true)}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              )}
              {error && (
                <View style={styles.spreadsheetFallback}>
                  <Text style={styles.spreadsheetFallbackText}>📊</Text>
                  <Text style={styles.spreadsheetFallbackTitle}>Excel/Spreadsheet File</Text>
                  <Text style={styles.spreadsheetFallbackSubtext}>
                    Excel files work best when opened in the Excel app.{'\n'}
                    Tap below to open in your mobile Excel app for the best experience.
                  </Text>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => {
                      Linking.openURL(fileUrl).catch(() => {
                        Alert.alert(
                          'Open Excel File', 
                          'Could not open the file automatically. Please ensure you have Excel or a compatible app installed.',
                          [
                            { text: 'OK', style: 'default' }
                          ]
                        );
                      });
                    }}
                  >
                    <Text style={styles.openButtonText}>📱 Open in Excel App</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.openButton, { backgroundColor: '#28a745', marginTop: 10 }]}
                    onPress={() => {
                      // Copy the file URL to clipboard for easy sharing
                      Alert.alert(
                        'File URL',
                        'You can copy this URL to access the file:\n\n' + fileUrl,
                        [
                          { text: 'Close', style: 'cancel' },
                          { 
                            text: 'Copy URL', 
                            onPress: () => {
                              // Note: In a real app, you'd use Clipboard.setString()
                              Alert.alert('URL Copied', 'File URL has been copied to clipboard');
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.openButtonText}>Show File URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            // For other documents, use Google Docs Viewer with better error handling
            <View style={styles.documentContainer}>
              <WebView
                source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` }}
                style={styles.webview}
                onError={(syntheticEvent) => {
                                    setError(true);
                }}
                onHttpError={(syntheticEvent) => {
                                    setError(true);
                }}
                onLoad={() => {
                                    setLoading(false);
                }}
                onLoadStart={() => setLoading(true)}
                startInLoadingState={true}
                scalesPageToFit={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
              {error && (
                <View style={styles.pdfFallback}>
                  <Text style={styles.pdfFallbackText}>📄 Document Preview Not Available</Text>
                  <Text style={[styles.spreadsheetFallbackSubtext, { color: '#ccc', marginBottom: 20 }]}>
                    The file was uploaded successfully but cannot be previewed in the app.{'\n'}
                    Please open it externally to view the content.
                  </Text>
                  <TouchableOpacity
                    style={styles.openButton}
                    onPress={() => {
                      Linking.openURL(fileUrl).catch(() => {
                        Alert.alert(
                          'Open Document', 
                          'Could not open the document automatically. Please download the file and open it with the appropriate application.',
                          [
                            { text: 'OK', style: 'default' }
                          ]
                        );
                      });
                    }}
                  >
                    <Text style={styles.openButtonText}>Open Document Externally</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>📄</Text>
        <Text style={styles.unsupportedText}>File type not supported</Text>
        <Text style={styles.unsupportedSubtext}>
          This file type cannot be viewed in the app
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
            <Text style={styles.fileType}>{fileType.toUpperCase()}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileType: {
    color: '#ccc',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight * 0.85,
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.85,
    backgroundColor: 'transparent',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    padding: 40,
  },
  videoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  videoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  openButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  documentContainer: {
    flex: 1,
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdfFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  pdfFallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsupportedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  unsupportedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  unsupportedSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Google Apps styles
  googleAppsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  googleAppsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  googleAppsText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  googleAppsSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  // Spreadsheet styles
  spreadsheetContainer: {
    flex: 1,
    position: 'relative',
  },
  spreadsheetFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  spreadsheetFallbackText: {
    fontSize: 48,
    marginBottom: 16,
  },
  spreadsheetFallbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  spreadsheetFallbackSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default FileViewer;
