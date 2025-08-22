import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';

interface InlineWebVideoProps {
  visible: boolean;
  videoUri: string;
  title?: string;
  onClose: () => void;
}

const InlineWebVideo: React.FC<InlineWebVideoProps> = ({
  visible,
  videoUri,
  title,
  onClose,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);

  const html = useMemo(() => {
    // Basic sanitization for embedding
    const src = String(videoUri).replace(/"/g, '&quot;');

    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <style>
            html, body { margin:0; padding:0; background:#000; height:100%; }
            .container { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#000; }
            video { width:100vw; height:100vh; object-fit:contain; background:#000; }
          </style>
        </head>
        <body>
          <div class="container">
            <video id="vid" controls playsinline webkit-playsinline preload="metadata">
              <source src="${src}" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <script>
            const vid = document.getElementById('vid');
            document.addEventListener('message', (e) => {
              if (e.data === 'play') vid && vid.play && vid.play();
            });
          </script>
        </body>
      </html>
    `;
  }, [videoUri]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: 'black' }]}>
        <StatusBar barStyle="light-content" backgroundColor="black" />

        {/* Header */}
        <View style={[tw['flex-row'], tw['items-center'], tw['justify-between'], tw['p-4'], { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[tw['px-4'], tw['py-2'], tw['rounded-full'], { backgroundColor: '#374151' }]}
          >
            <Text style={[tw['text-white'], tw['font-medium']]}>← Back</Text>
          </TouchableOpacity>
          {title ? (
            <Text style={[tw['text-white'], tw['font-medium'], tw['flex-1'], tw['text-center'], tw['mx-4']]} numberOfLines={1}>
              {title}
            </Text>
          ) : <View style={{ width: 64 }} />}
          <View style={{ width: 64 }} />
        </View>

        {/* WebView Video */}
        <View style={[tw['flex-1'], { backgroundColor: 'black' }]}>
          <WebView
            source={{ html }}
            style={[tw['flex-1'], { backgroundColor: 'black' }]}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            javaScriptEnabled
            domStorageEnabled
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(e) => {
              setLoading(false);
              Alert.alert('Playback Error', 'Could not load the video in-app. Opening externally...', [
                { text: 'Open', onPress: () => onClose() }
              ]);
            }}
          />

          {loading && (
            <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center' }}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={[tw['text-white'], tw['mt-2']]}>Loading video…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default InlineWebVideo;
