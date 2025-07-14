import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading EduLearn..." 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* App Logo */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>📚</Text>
        </View>
        <Text style={styles.appName}>EduLearn</Text>
        <Text style={styles.tagline}>Education Made Simple</Text>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Preparing your learning experience...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007BFF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    color: '#fff',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
});

export default LoadingScreen;
