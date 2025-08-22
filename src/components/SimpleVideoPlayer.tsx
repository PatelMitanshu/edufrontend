import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';

interface SimpleVideoPlayerProps {
  visible: boolean;
  videoUri: string;
  title?: string;
  onClose: () => void;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({
  visible,
  videoUri,
  title,
  onClose,
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  const handleOpenVideo = () => {// Try to open the video URL
    Linking.openURL(videoUri)
      .then(() => {onClose(); // Close the modal after opening
      })
      .catch((error) => {
        console.error('Failed to open video:', error);
        Alert.alert(
          'Cannot Open Video', 
          'Unable to open the video. The URL might be invalid or the video may not be properly uploaded.',
          [
            { text: 'Copy URL', onPress: () => {
              // You could implement clipboard functionality here
              Alert.alert('Video URL', videoUri);
            }},
            { text: 'OK', onPress: () => onClose() }
          ]
        );
      });
  };

  // Generate video thumbnail URL from Cloudinary
  const getVideoThumbnail = (videoUrl: string) => {
    if (videoUrl.includes('cloudinary.com')) {
      // Extract the public ID and create a thumbnail URL
      const parts = videoUrl.split('/');
      const uploadIndex = parts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
        // Insert transformation parameters for thumbnail
        const thumbnailUrl = [
          ...parts.slice(0, uploadIndex + 1),
          'c_thumb,w_300,h_200,f_jpg',
          ...parts.slice(uploadIndex + 1)
        ].join('/').replace(/\.[^.]+$/, '.jpg'); // Change extension to jpg
        return thumbnailUrl;
      }
    }
    return null;
  };

  const thumbnailUrl = getVideoThumbnail(videoUri);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['p-4'], { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-4'], tw['py-2'], tw['rounded-full'], { backgroundColor: theme.colors.primary }]}
            onPress={onClose}
          >
            <Text style={[tw['text-white'], tw['font-medium']]}>← Back</Text>
          </TouchableOpacity>
          
          {title && (
            <Text style={[tw['font-medium'], tw['flex-1'], tw['text-center'], tw['mx-4'], { color: theme.colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          
          <View style={[tw['w-16']]} />
        </View>

        {/* Video Preview Container */}
        <View style={[tw['flex-1'], tw['items-center'], tw['justify-center'], tw['p-8']]}>
          {/* Video Thumbnail or Icon */}
          <View style={[tw['rounded-lg'], tw['items-center'], tw['justify-center'], tw['mb-6'], { width: 300, height: 200, backgroundColor: theme.colors.primary + '20' }]}>
            {thumbnailUrl && !imageError ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={[tw['rounded-lg'], { width: 300, height: 200 }]}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <Text style={[{ fontSize: 64, color: theme.colors.primary }]}>🎬</Text>
            )}
            
            {/* Play Button Overlay */}
            <View style={[tw['items-center'], tw['justify-center'], { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
              <View style={[tw['w-16'], tw['h-16'], tw['rounded-full'], tw['items-center'], tw['justify-center'], { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Text style={[{ fontSize: 24, color: 'white' }]}>▶️</Text>
              </View>
            </View>
          </View>
          
          <Text style={[tw['text-xl'], tw['font-bold'], tw['text-center'], tw['mb-4'], { color: theme.colors.text }]}>
            {title || 'Video Content'}
          </Text>
          
          <Text style={[tw['text-sm'], tw['text-center'], tw['px-4'], { color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 32 }]}>
            Tap to play this video in your device's video player or browser for the best viewing experience.
          </Text>

          <TouchableOpacity
            style={[tw['py-4'], tw['rounded-full'], tw['mb-4'], { backgroundColor: theme.colors.primary, paddingHorizontal: 32 }]}
            onPress={handleOpenVideo}
          >
            <Text style={[tw['text-white'], tw['font-bold'], tw['text-center']]}>
              🎥 Play Video
            </Text>
          </TouchableOpacity>

          <Text style={[tw['text-xs'], tw['text-center'], tw['px-4'], { color: theme.colors.textSecondary }]}>
            Video will open in external player
          </Text>
          
          {/* Debug Info */}
          {videoUri && (
            <TouchableOpacity 
              style={[tw['mt-4'], tw['p-2']]}
              onPress={() => Alert.alert('Video URL', videoUri)}
            >
              <Text style={[tw['text-xs'], { color: theme.colors.textSecondary }]}>
                Tap to view URL
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SimpleVideoPlayer;
