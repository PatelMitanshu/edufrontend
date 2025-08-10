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
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

enum ForgotPasswordStep {
  EMAIL_INPUT = 'EMAIL_INPUT',
  OTP_VERIFICATION = 'OTP_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET'
}

function ForgotPassword() {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const navigation = useNavigation<any>();
  
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.EMAIL_INPUT);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await authService.sendPasswordResetOTP(email.trim());
      Alert.alert('Success', 'OTP has been sent to your email address');
      setCurrentStep(ForgotPasswordStep.OTP_VERIFICATION);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyPasswordResetOTP(email.trim(), otp.trim());
      Alert.alert('Success', 'OTP verified successfully');
      setCurrentStep(ForgotPasswordStep.PASSWORD_RESET);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        'Error', 
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert(
        'Success', 
        'Password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailInput = () => (
    <>
      <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
        Forgot Password
      </Text>
      <Text style={[tw['text-sm'], tw['text-secondary'], tw['mb-6'], tw['text-center'], tw['leading-relaxed']]}>
        Enter your email address and we'll send you an OTP to reset your password.
      </Text>
      
      <View style={tw['mb-6']}>
        <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>
          Email Address
        </Text>
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
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['tracking-wide']]}>
            Send OTP
          </Text>
        )}
      </Pressable>
    </>
  );

  const renderOTPVerification = () => (
    <>
      <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
        Verify OTP
      </Text>
      <Text style={[tw['text-sm'], tw['text-secondary'], tw['mb-6'], tw['text-center'], tw['leading-relaxed']]}>
        We've sent a 6-digit OTP to {email}. Please enter it below.
      </Text>
      
      <View style={tw['mb-6']}>
        <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>
          OTP Code
        </Text>
        <View style={[tw['border-l-4'], tw['border-blue-500'], tw['bg-primary-light']]}>
          <TextInput
            style={[tw['h-13'], tw['border'], tw['border-blue-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface'], tw['text-center']]}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={theme.colors.textMuted}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            autoCorrect={false}
          />
        </View>
      </View>

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
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['tracking-wide']]}>
            Verify OTP
          </Text>
        )}
      </Pressable>

      <Pressable 
        style={[tw['items-center'], tw['py-2']]}
        onPress={() => setCurrentStep(ForgotPasswordStep.EMAIL_INPUT)}
      >
        <Text style={[tw['text-primary'], tw['text-sm'], { textDecorationLine: 'underline' }]}>
          Change Email Address
        </Text>
      </Pressable>
    </>
  );

  const renderPasswordReset = () => (
    <>
      <Text style={[tw['text-2xl'], tw['font-bold'], tw['text-primary'], tw['mb-6'], tw['text-center']]}>
        Reset Password
      </Text>
      <Text style={[tw['text-sm'], tw['text-secondary'], tw['mb-6'], tw['text-center'], tw['leading-relaxed']]}>
        Enter your new password below.
      </Text>
      
      <View style={tw['mb-5']}>
        <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>
          New Password
        </Text>
        <View style={[tw['border-l-4'], tw['border-purple-500'], tw['bg-primary-light']]}>
          <TextInput
            style={[tw['h-13'], tw['border'], tw['border-purple-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
            placeholder="Enter new password"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={tw['mb-6']}>
        <Text style={[tw['text-sm'], tw['font-semibold'], tw['text-primary'], tw['mb-2'], tw['tracking-wide'], tw['uppercase']]}>
          Confirm Password
        </Text>
        <View style={[tw['border-l-4'], tw['border-purple-500'], tw['bg-primary-light']]}>
          <TextInput
            style={[tw['h-13'], tw['border'], tw['border-purple-200'], tw['rounded-xl'], tw['px-4'], tw['text-base'], tw['text-primary'], tw['bg-surface']]}
            placeholder="Confirm new password"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />
        </View>
      </View>

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
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[tw['text-white'], tw['text-lg'], tw['font-bold'], tw['tracking-wide']]}>
            Reset Password
          </Text>
        )}
      </Pressable>
    </>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case ForgotPasswordStep.EMAIL_INPUT:
        return renderEmailInput();
      case ForgotPasswordStep.OTP_VERIFICATION:
        return renderOTPVerification();
      case ForgotPasswordStep.PASSWORD_RESET:
        return renderPasswordReset();
      default:
        return renderEmailInput();
    }
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
          {/* Header Section */}
          <View style={[tw['items-center'], tw['mb-10']]}>
            <View style={[tw['w-24'], tw['h-24'], tw['rounded-full'], tw['bg-white'], tw['justify-center'], tw['items-center'], tw['mb-4'], tw['shadow-xl']]}>
              <Text style={tw['text-5xl']}>🔐</Text>
            </View>
            <Text style={[tw['text-4xl'], tw['font-extrabold'], tw['text-white'], tw['mb-2'], tw['tracking-wide']]}>
              EduLearn
            </Text>
            <Text style={[tw['text-lg'], tw['text-white'], tw['text-center'], tw['leading-relaxed'], tw['font-light']]}>
              Secure & Easy Password Recovery
            </Text>
          </View>

          {/* Form Container */}
          <View style={[tw['bg-surface'], tw['rounded-3xl'], tw['p-6'], tw['shadow-2xl'], tw['border'], tw['border-primary']]}>
            {getCurrentStepContent()}

            {/* Back to Login */}
            <View style={[tw['flex-row'], tw['items-center'], tw['my-6']]}>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
              <Text style={[tw['mx-4'], tw['text-sm'], tw['text-secondary'], tw['font-medium'], tw['bg-primary-light'], tw['px-3'], tw['py-1'], tw['rounded-full']]}>
                OR
              </Text>
              <View style={[tw['flex-1'], tw['h-px'], tw['bg-gray-200']]} />
            </View>

            <Pressable 
              style={[tw['border-2'], tw['border-primary'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['bg-primary-light'], tw['shadow-xs']]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[tw['text-primary-500'], tw['text-lg'], tw['font-semibold'], tw['tracking-wide']]}>
                Back to Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPassword;
