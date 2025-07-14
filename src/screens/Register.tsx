import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

function Register() {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.register({ 
        name: name.trim(), 
        email: email.trim(), 
        password 
      });
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('teacherData', JSON.stringify(response.teacher));
      
      // Navigate to Home
      navigation.replace('Dashboard');
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={[tw['flex-1'], tw['bg-gradient-primary']]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "light-content"} 
        backgroundColor={theme.colors.gradientStart} 
      />
      <KeyboardAvoidingView 
        style={tw['flex-1']} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[tw['flex-grow'], tw['justify-center'], tw['px-5'], tw['py-10']]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Enhanced Header Section */}
          <View style={[tw['items-center'], tw['mb-10']]}>
            <View style={[tw['w-24'], tw['h-24'], tw['rounded-full'], tw['bg-white'], tw['justify-center'], tw['items-center'], tw['mb-4'], tw['shadow-xl']]}>
              <Text style={tw['text-5xl']}>👨‍🏫</Text>
            </View>
            <Text style={[tw['text-4xl'], tw['font-extrabold'], tw['text-white'], tw['mb-2'], tw['tracking-wide']]}>Join EduLearn</Text>
            <Text style={[tw['text-lg'], tw['text-white'], tw['text-center'], tw['leading-relaxed'], tw['font-light']]}>
              Create your teacher account to get started
            </Text>
          </View>

          {/* Enhanced Form Container */}
          <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['shadow-2xl'], tw['border'], tw['border-primary']]}>
            <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
              Create Account
            </Text>
            
            <View style={tw['mb-5']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Full Name</Text>
              <TextInput
                style={[tw['h-13'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={tw['mb-5']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Email</Text>
              <TextInput
                style={[tw['h-13'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={tw['mb-5']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Password</Text>
              <TextInput
                style={[tw['h-13'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                placeholder="Create a strong password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              <Text style={[tw['text-xs'], tw['text-secondary'], tw['mt-1'], { lineHeight: 16 }]}>
                Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
              </Text>
            </View>

            <View style={tw['mb-6']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Confirm Password</Text>
              <TextInput
                style={[tw['h-13'], tw['border'], tw['border-gray-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            {/* Enhanced Register Button */}
            <Pressable 
              style={[
                tw['bg-gradient-primary'], 
                tw['py-4'], 
                tw['rounded-xl'], 
                tw['items-center'], 
                tw['shadow-colored-blue'],
                tw['mb-4'],
                loading && tw['bg-gray-500']
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['tracking-wide']]}>Create Account</Text>
              )}
            </Pressable>

            {/* Enhanced Divider */}
            <View style={[tw['flex-row'], tw['items-center'], tw['my-6']]}>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
              <Text style={[tw['mx-4'], tw['text-sm'], tw['text-secondary'], tw['font-medium'], tw['bg-primary-light'], tw['px-3'], tw['py-1'], tw['rounded-full']]}>OR</Text>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
            </View>

            {/* Enhanced Login Button */}
            <Pressable 
              style={[tw['border-2'], tw['border-primary'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['bg-primary-light'], tw['shadow-xs']]}
              onPress={navigateToLogin}
            >
              <Text style={[tw['text-primary-500'], tw['text-lg'], tw['font-semibold'], tw['tracking-wide']]}>
                Already have an account? Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export default Register;
