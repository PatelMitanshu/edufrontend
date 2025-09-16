import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { downloadAndInstallApk } from '../services/inAppUpdateService';

// Test component to verify APK download URL
const TestAPKDownload: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const testDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Test the current download URL
      const testUrl = 'https://github.com/PatelMitanshu/edufrontend/releases/latest/download/edulearn-2.0.0.apk';
      
      console.log('Testing download URL:', testUrl);
      
      // First, let's test if the URL is accessible
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        console.log('URL Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
        
        if (response.status === 404) {
          Alert.alert(
            'Download URL Error',
            'The APK file was not found at the specified URL. Please:\n\n1. Create a GitHub release\n2. Upload the APK file to the release\n3. Make sure the filename matches: edulearn-2.0.0.apk'
          );
          return;
        }
        
        if (response.headers.get('content-type')?.includes('text/html')) {
          Alert.alert(
            'Wrong File Type',
            'The URL is returning HTML instead of an APK file. This means the download URL is incorrect.'
          );
          return;
        }
        
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) < 1024 * 1024) {
          Alert.alert(
            'File Too Small',
            `The file size is ${Math.round(parseInt(contentLength) / 1024)}KB, which is too small for an APK. This might be an error page.`
          );
          return;
        }
        
        Alert.alert(
          'URL Test Passed!',
          `✅ URL is accessible\n✅ Status: ${response.status}\n✅ Content-Length: ${Math.round(parseInt(contentLength || '0') / 1024 / 1024)}MB\n\nProceeding with download test...`
        );
        
      } catch (fetchError) {
        console.error('URL test failed:', fetchError);
        Alert.alert(
          'Network Error',
          'Could not access the download URL. Check your internet connection and the URL.'
        );
        return;
      }
      
      // Now test the actual download
      const result = await downloadAndInstallApk({
        downloadUrl: testUrl,
        version: '2.0.0',
        onProgress: (progress) => {
          console.log(`Download progress: ${progress.progressPercent.toFixed(1)}%`);
        }
      });
      
      console.log('Download result:', result);
      
    } catch (error) {
      console.error('Download test failed:', error);
      Alert.alert(
        'Download Test Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <View style={{ padding: 20, backgroundColor: 'white', margin: 10, borderRadius: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        🧪 APK Download Test
      </Text>
      
      <Text style={{ marginBottom: 15, color: '#666' }}>
        This will test if the APK download URL is working correctly.
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: isDownloading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={testDownload}
        disabled={isDownloading}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {isDownloading ? '🔄 Testing Download...' : '🧪 Test APK Download'}
        </Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 12, marginTop: 10, color: '#999' }}>
        This will verify the URL and attempt to download the APK file.
      </Text>
    </View>
  );
};

export default TestAPKDownload;