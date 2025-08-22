import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { tw } from '../utils/tailwind';
import { useTheme } from '../contexts/ThemeContext';

interface VideoPlayerProps {
  visible: boolean;
  videoUri: string;
  title?: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  visible,
  videoUri,
  title,
  onClose,
}) => {
  const { theme } = useTheme();
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<any>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoadStart = () => {setLoading(true);
  };

  const handleLoad = (data: any) => {setLoading(false);
    setDuration(data.duration);
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
  };

  const handleError = (error: any) => {
    console.error('Video player error:', error);
    console.error('Failed video URL:', videoUri);
    setLoading(false);
    Alert.alert('Error', `Failed to load video: ${error.error || 'Unknown error'}`);
    onClose();
  };

  const togglePlayPause = () => {
    setPaused(!paused);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: 'black' }]}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        
        {/* Header */}
        {showControls && (
          <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['p-4'], { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
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
        )}

        {/* Video Container */}
        <View style={[tw['flex-1'], tw['items-center'], tw['justify-center'], { backgroundColor: 'black' }]}>
          <TouchableOpacity
            style={[tw['flex-1'], { width: '100%' }]}
            onPress={toggleControls}
            activeOpacity={1}
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={{
                width: screenWidth,
                height: showControls ? screenHeight * 0.7 : screenHeight,
                backgroundColor: 'black',
              }}
              resizeMode="contain"
              paused={paused}
              onLoadStart={handleLoadStart}
              onLoad={handleLoad}
              onProgress={handleProgress}
              onError={handleError}
              controls={false}
              repeat={false}
            />
            
            {/* Loading Indicator */}
            {loading && (
              <View style={[tw['items-center'], tw['justify-center'], { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={[tw['text-white'], tw['mt-2']]}>Loading video...</Text>
              </View>
            )}
            
            {/* Play/Pause Button Overlay */}
            {!loading && showControls && (
              <TouchableOpacity
                style={[tw['items-center'], tw['justify-center'], { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
                onPress={togglePlayPause}
                activeOpacity={0.7}
              >
                <View style={[tw['w-20'], tw['h-20'], tw['rounded-full'], tw['items-center'], tw['justify-center'], { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={[tw['text-white'], { fontSize: 30 }]}>
                    {paused ? '▶️' : '⏸️'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Video Controls */}
        {showControls && !loading && (
          <View style={[tw['p-4'], tw['items-center'], { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
            {/* Progress Bar */}
            <View style={[tw['mb-4'], { width: '100%' }]}>
              <View style={[tw['rounded-full'], { height: 4, backgroundColor: '#374151' }]}>
                <View 
                  style={[
                    tw['rounded-full'], 
                    { 
                      height: 4,
                      backgroundColor: '#3B82F6',
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                    }
                  ]} 
                />
              </View>
              <View style={[tw['flex-row'], tw['justify-between'], tw['mt-2']]}>
                <Text style={[tw['text-white'], tw['text-xs']]}>
                  {formatTime(currentTime)}
                </Text>
                <Text style={[tw['text-white'], tw['text-xs']]}>
                  {formatTime(duration)}
                </Text>
              </View>
            </View>

            {/* Control Buttons */}
            <View style={[tw['flex-row'], tw['items-center'], tw['justify-center']]}>
              <TouchableOpacity
                style={[tw['p-3'], { marginHorizontal: 32 }]}
                onPress={togglePlayPause}
              >
                <Text style={[tw['text-white'], { fontSize: 24 }]}>
                  {paused ? '▶️' : '⏸️'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[tw['text-gray-400'], tw['text-xs'], tw['mt-2']]}>
              🎬 Video Player • Tap to toggle controls
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default VideoPlayer;
