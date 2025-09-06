import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LazyImageProps {
  source?: { uri: string };
  uri?: string;
  style?: any;
  width?: number;
  height?: number;
  fallback?: React.ReactNode;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  source, 
  uri,
  style, 
  width = 50, 
  height = 50,
  fallback
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine the image URI from either source or uri prop
  const imageUri = source?.uri || uri;

  useEffect(() => {
    // Add random delay to stagger image loads and prevent memory pool exhaustion
    const delay = Math.random() * 300; // 0-300ms random delay
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const handleError = () => {
    setHasError(true);
  };

  if (!imageUri || !shouldLoad || hasError) {
    // Show custom fallback or default avatar icon while loading or on error
    if (fallback) {
      return (
        <View style={[
          styles.fallbackContainer, 
          style,
          { width, height }
        ]}>
          {fallback}
        </View>
      );
    }
    
    return (
      <View style={[
        styles.fallbackContainer, 
        style,
        { width, height }
      ]}>
        <Icon 
          name="person" 
          size={width * 0.6} 
          color="#666" 
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={[style, { width, height }]}
      onError={handleError}
      resizeMethod="resize" // Use resize instead of scale for better memory usage
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
