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

function Login() {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login({ email: email.trim(), password });
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('teacherData', JSON.stringify(response.teacher));
      
      // Navigate to Dashboard (previously Home)
      navigation.replace('Dashboard');
      
      // Reset form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
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
              <Text style={tw['text-5xl']}>📚</Text>
            </View>
            <Text style={[tw['text-4xl'], tw['font-extrabold'], tw['text-white'], tw['mb-2'], tw['tracking-wide']]}>EduLearn</Text>
            <Text style={[tw['text-lg'], tw['text-white'], tw['text-center'], tw['leading-relaxed'], tw['font-light']]}>
              Education Made Simple & Beautiful
            </Text>
          </View>

          {/* Enhanced Form Container */}
          <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['shadow-2xl'], tw['border'], tw['border-primary']]}>
            <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
              Welcome Back
            </Text>
            
            <View style={tw['mb-5']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Email</Text>
              <View style={[tw['border-l-4'], tw['border-blue-500'], tw['bg-primary-light']]}>
                <TextInput
                  style={[tw['h-13'], tw['border'], tw['border-blue-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={tw['mb-6']}>
              <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>Password</Text>
              <View style={[tw['border-l-4'], tw['border-purple-500'], tw['bg-primary-light']]}>
                <TextInput
                  style={[tw['h-13'], tw['border'], tw['border-purple-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Enhanced Login Button */}
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
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['tracking-wide']]}>Login</Text>
              )}
            </Pressable>

            {/* Forgot Password Link */}
            <Pressable 
              style={[{ alignSelf: 'flex-end' }, tw['py-2'], tw['mb-2']]}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[tw['text-primary'], tw['text-sm'], tw['font-medium'], { textDecorationLine: 'underline' }]}>
                Forgot Password?
              </Text>
            </Pressable>

            {/* Enhanced Divider */}
            <View style={[tw['flex-row'], tw['items-center'], tw['my-6']]}>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
              <Text style={[tw['mx-4'], tw['text-sm'], tw['text-secondary'], tw['font-medium'], tw['bg-primary-light'], tw['px-3'], tw['py-1'], tw['rounded-full']]}>OR</Text>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
            </View>

            {/* Enhanced Register Button */}
            <Pressable 
              style={[tw['border-2'], tw['border-primary'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['bg-primary-light'], tw['shadow-xs']]}
              onPress={navigateToRegister}
            >
              <Text style={[tw['text-primary-500'], tw['text-lg'], tw['font-semibold'], tw['tracking-wide']]}>
                Create New Account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Login;
