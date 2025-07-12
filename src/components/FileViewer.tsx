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

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isDocument = mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text');

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
      return (
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎥</Text>
            <Text style={styles.videoText}>Video File</Text>
            <Text style={styles.videoSubtext}>Tap to open in external player</Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => {
                console.log('Opening video URL:', fileUrl);
                console.log('Video mime type:', mimeType);
                
                // For Android, try to open with Intent
                if (Platform.OS === 'android') {
                  const videoIntent = `intent:${fileUrl}#Intent;type=video/*;package=com.google.android.youtube;scheme=https;end`;
                  
                  Linking.canOpenURL(videoIntent)
                    .then((supported) => {
                      if (supported) {
                        return Linking.openURL(videoIntent);
                      } else {
                        // Fallback to direct URL
                        return Linking.openURL(fileUrl);
                      }
                    })
                    .catch((error) => {
                      console.error('Error opening video:', error);
                      // Try direct URL as final fallback
                      Linking.openURL(fileUrl).catch(() => {
                        Alert.alert('Error', 'Could not open video. Please ensure you have a video player app installed.');
                      });
                    });
                } else {
                  // iOS - direct URL should work
                  Linking.openURL(fileUrl).catch((error) => {
                    console.error('Error opening video:', error);
                    Alert.alert('Error', 'Could not open video');
                  });
                }
              }}
            >
              <Text style={styles.openButtonText}>Open Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (isDocument) {
      return (
        <View style={styles.documentContainer}>
          {mimeType.includes('pdf') ? (
            // For PDFs, provide multiple viewing options
            <View style={styles.pdfContainer}>
              <WebView
                source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true` }}
                style={styles.webview}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
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
          ) : (
            // For other documents, use direct WebView
            <WebView
              source={{ uri: fileUrl }}
              style={styles.webview}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                handleError();
              }}
              onLoad={() => setLoading(false)}
              onLoadStart={() => setLoading(true)}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
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
});

export default FileViewer;
