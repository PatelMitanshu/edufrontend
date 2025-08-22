import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';

interface ImageViewerProps {
  visible: boolean;
  imageUri: string;
  title?: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  imageUri,
  title,
  onClose,
}) => {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: 'black' }]}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        {/* Header */}
        <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['p-4'], { backgroundColor: 'black' }]}>
          <TouchableOpacity
            style={[tw['flex-row'], tw['items-center'], tw['px-4'], tw['py-2'], tw['rounded-full'], { backgroundColor: '#374151' }]}
            onPress={onClose}
          >
            <Text style={[tw['text-white'], tw['font-medium']]}>← Back</Text>
          </TouchableOpacity>
          
          {title && (
            <Text style={[tw['text-white'], tw['font-medium'], tw['flex-1'], tw['text-center'], tw['mx-4']]} numberOfLines={1}>
              {title}
            </Text>
          )}
          
          <View style={[tw['w-16']]} />
        </View>

        {/* Image Container */}
        <View style={[tw['flex-1'], tw['items-center'], tw['justify-center'], { backgroundColor: 'black' }]}>
          <Image
            source={{ uri: imageUri }}
            style={{
              width: screenWidth,
              height: screenHeight * 0.8,
              resizeMode: 'contain',
            }}
            onError={() => {
              Alert.alert('Error', 'Failed to load image');
              onClose();
            }}
          />
        </View>

        {/* Footer with Image Info */}
        <View style={[tw['p-4'], tw['items-center'], { backgroundColor: 'black' }]}>
          <Text style={[tw['text-gray-400'], tw['text-sm']]}>
            📷 Image Viewer
          </Text>
          <Text style={[tw['text-gray-500'], tw['text-xs'], tw['mt-1']]}>
            Tap and hold to save (if supported)
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ImageViewer;
