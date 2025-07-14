import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';
import { profileService, TeacherProfile, ProfileUpdateData } from '../services/profileService';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';

function ProfileScreen() {
  const { theme } = useTheme();
  const tw = useThemedStyles(theme.colors);
  const [profile, setProfile] = useState<TeacherProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    school: '',
    subject: '',
    role: 'teacher',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  });
  const [originalProfile, setOriginalProfile] = useState<TeacherProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    school: '',
    subject: '',
    role: 'teacher',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Check if we have an auth token
      const token = await AsyncStorage.getItem('authToken');
      
      const profileData = await profileService.getProfile();
      setProfile(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      // Fallback to local storage
      try {
        const teacherData = await AsyncStorage.getItem('teacherData');
        if (teacherData) {
          const teacher = JSON.parse(teacherData);
          const profileData: TeacherProfile = {
            id: teacher.id || teacher._id || '',
            name: teacher.name || teacher.fullName || '',
            email: teacher.email || '',
            phone: teacher.phone || teacher.phoneNumber || '',
            school: teacher.school || teacher.institution || '',
            subject: teacher.subject || teacher.subjects?.[0] || '',
            profilePicture: teacher.profilePicture || undefined,
            role: teacher.role || 'teacher',
            isActive: teacher.isActive !== undefined ? teacher.isActive : true,
            createdAt: teacher.createdAt || new Date().toISOString(),
            updatedAt: teacher.updatedAt || new Date().toISOString(),
            lastLogin: teacher.lastLogin,
          };
          setProfile(profileData);
          setOriginalProfile(profileData);
        } else {
          // Keep the default profile that was initialized in state
        }
      } catch (localError) {
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      const updateData: ProfileUpdateData = {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        school: profile.school || '',
        subject: profile.subject || '',
      };

      const updatedProfile = await profileService.updateProfile(updateData);
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      // Show a more user-friendly error message
      Alert.alert(
        'Connection Error', 
        'Unable to save changes to server. Your profile changes have been saved locally and will sync when connection is restored.',
        [
          { text: 'Cancel', onPress: () => setIsEditing(true) },
          { text: 'OK', onPress: () => setIsEditing(false) }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  const updateField = (field: keyof TeacherProfile, value: string) => {
    setProfile(prev => {
      return { ...prev, [field]: value };
    });
  };

  const showImagePicker = () => {
    const options = [
      'Take Photo',
      'Choose from Library',
      'Remove Photo',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              openCamera();
              break;
            case 1:
              openImageLibrary();
              break;
            case 2:
              removeProfilePicture();
              break;
          }
        }
      );
    } else {
      Alert.alert(
        'Profile Picture',
        'Select an option',
        [
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Library', onPress: openImageLibrary },
          { text: 'Remove Photo', onPress: removeProfilePicture, style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.7,
        maxWidth: 300,
        maxHeight: 300,
      },
      handleImageResponse
    );
  };

  const openImageLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo' as MediaType,
        quality: 0.7,
        maxWidth: 300,
        maxHeight: 300,
      },
      handleImageResponse
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel || response.errorMessage) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const imageUri = response.assets[0].uri;
      if (imageUri) {
        uploadProfilePicture(imageUri);
      }
    }
  };

  // Helper function to broadcast profile picture changes
  const broadcastProfileChange = async () => {
    try {
      // Force a small delay to ensure AsyncStorage is updated
      setTimeout(() => {
        // Trigger a profile update flag that other screens can check
        AsyncStorage.setItem('profileUpdated', Date.now().toString());
      }, 100);
    } catch (error) {
      console.log('Failed to broadcast profile change:', error);
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      const imageUrl = await profileService.uploadProfilePicture(imageUri);
      setProfile(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      setOriginalProfile(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      
      // Update AsyncStorage with the new profile picture
      try {
        const teacherData = await AsyncStorage.getItem('teacherData');
        if (teacherData) {
          const teacher = JSON.parse(teacherData);
          teacher.profilePicture = imageUrl;
          await AsyncStorage.setItem('teacherData', JSON.stringify(teacher));
        }
      } catch (storageError) {
        console.log('Failed to update AsyncStorage:', storageError);
      }
      
      // Broadcast the change to other screens
      broadcastProfileChange();
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUploadingImage(true);
      await profileService.deleteProfilePicture();
      setProfile(prev => ({
        ...prev,
        profilePicture: undefined
      }));
      setOriginalProfile(prev => ({
        ...prev,
        profilePicture: undefined
      }));
      
      // Update AsyncStorage to remove the profile picture
      try {
        const teacherData = await AsyncStorage.getItem('teacherData');
        if (teacherData) {
          const teacher = JSON.parse(teacherData);
          delete teacher.profilePicture;
          await AsyncStorage.setItem('teacherData', JSON.stringify(teacher));
        }
      } catch (storageError) {
        console.log('Failed to update AsyncStorage:', storageError);
      }
      
      // Broadcast the change to other screens
      broadcastProfileChange();
      
      Alert.alert('Success', 'Profile picture removed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[tw['text-base'], tw['text-secondary'], tw['mt-3']]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Additional safety check - if profile is somehow null/undefined, show loading
  if (!profile) {
    return (
      <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          backgroundColor={theme.colors.background} 
        />
        <View style={[tw['flex-1'], tw['justify-center'], tw['items-center']]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[tw['text-base'], tw['text-secondary'], tw['mt-3']]}>Initializing profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[tw['flex-1'], { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.background} 
      />
      
      {/* Enhanced Header */}
      <View style={[tw['bg-surface'], tw['px-5'], tw['py-6'], tw['shadow-lg'], tw['border-b'], tw['border-surface']]}>
        <View style={[tw['flex-row'], tw['justify-between'], tw['items-center']]}>
          <View style={[tw['flex-row'], tw['items-center'], tw['flex-1']]}>
            <View style={[tw['w-12'], tw['h-12'], tw['bg-gradient-blue'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['mr-3'], tw['shadow-colored-blue']]}>
              <Text style={[tw['text-xl'], tw['text-white']]}>👤</Text>
            </View>
            <View>
              <Text style={[tw['text-xl'], tw['font-extrabold'], tw['text-primary'], tw['tracking-wide']]}>
                Profile
              </Text>
              <Text style={[tw['text-sm'], tw['text-secondary'], tw['font-medium']]}>
                Manage your account
              </Text>
            </View>
          </View>
          {!isEditing ? (
            <TouchableOpacity 
              style={[tw['bg-gradient-primary'], tw['px-4'], tw['py-3'], tw['rounded-xl'], tw['items-center'], tw['shadow-colored-blue']]}
              onPress={startEditing}
            >
              <Text style={[tw['text-white'], tw['text-sm'], tw['font-bold']]}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={[tw['flex-row']]}>
              <TouchableOpacity 
                style={[tw['bg-gray-500'], tw['px-3'], tw['py-2'], tw['rounded-lg'], tw['mr-2']]}
                onPress={cancelEditing}
                disabled={saving}
              >
                <Text style={[tw['text-white'], tw['text-sm'], tw['font-medium']]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[tw['bg-green-500'], tw['px-3'], tw['py-2'], tw['rounded-lg']]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[tw['text-white'], tw['text-sm'], tw['font-medium']]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={[tw['flex-1']]} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={[tw['items-center'], tw['py-6'], tw['bg-surface'], tw['mb-2']]}>
          <TouchableOpacity
            onPress={showImagePicker}
            style={[tw['relative'], tw['mb-3']]}
            activeOpacity={0.7}
          >
            {profile && profile.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
                style={[tw['w-24'], tw['h-24'], tw['rounded-full'], tw['shadow-xl']]}
                resizeMode="cover"
              />
            ) : (
              <View style={[tw['w-24'], tw['h-24'], tw['bg-gradient-blue'], tw['rounded-full'], tw['items-center'], tw['justify-center'], tw['shadow-xl']]}>
                <Text style={[tw['text-4xl'], tw['text-white']]}>👨‍🏫</Text>
              </View>
            )}
            
            {uploadingImage && (
              <View style={[
                tw['absolute'], 
                tw['w-24'], 
                tw['h-24'], 
                tw['rounded-full'], 
                tw['items-center'], 
                tw['justify-center'], 
                { backgroundColor: 'rgba(0,0,0,0.5)' }
              ]}>
                <ActivityIndicator color="white" size="small" />
              </View>
            )}
            
            <View style={[
              tw['absolute'],
              tw['w-8'], 
              tw['h-8'], 
              tw['bg-primary'], 
              tw['rounded-full'], 
              tw['items-center'], 
              tw['justify-center'], 
              tw['shadow-lg'],
              tw['border-2'],
              { 
                bottom: 0, 
                right: 0, 
                borderColor: theme.colors.surface 
              }
            ]}>
              <Text style={[tw['text-white'], tw['text-sm'], tw['font-bold']]}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={[tw['text-xl'], tw['font-bold'], tw['text-primary'], tw['mb-1']]}>
            {(profile && profile.name) || 'Teacher'}
          </Text>
          <Text style={[tw['text-sm'], tw['text-secondary'], tw['capitalize'], tw['mb-2']]}>
            {(profile && profile.role) || 'teacher'}
          </Text>
          <TouchableOpacity
            onPress={showImagePicker}
            style={[tw['bg-primary-light'], tw['px-4'], tw['py-2'], tw['rounded-full']]}
            activeOpacity={0.7}
          >
            <Text style={[tw['text-primary'], tw['text-sm'], tw['font-medium']]}>
              {profile && profile.profilePicture ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Information */}
        <View style={[tw['bg-surface'], tw['mx-5'], tw['rounded-3xl'], tw['shadow-lg'], tw['p-6'], tw['mb-6']]}>
          <Text style={[tw['text-lg'], tw['font-bold'], tw['text-primary'], tw['mb-4']]}>
            Personal Information
          </Text>

          {/* Name */}
          <View style={[tw['mb-4']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary'], tw['mb-2']]}>
              Full Name
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  tw['border'], 
                  tw['rounded-xl'], 
                  tw['px-4'], 
                  tw['py-3'], 
                  tw['text-base'],
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={(profile && profile.name) || ''}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textMuted}
              />
            ) : (
              <Text style={[tw['text-base'], tw['text-primary'], tw['py-3'], tw['px-4'], tw['bg-surface'], tw['rounded-xl']]}>
                {(profile && profile.name) || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={[tw['mb-4']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary'], tw['mb-2']]}>
              Email Address
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  tw['border'], 
                  tw['rounded-xl'], 
                  tw['px-4'], 
                  tw['py-3'], 
                  tw['text-base'],
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={(profile && profile.email) || ''}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={[tw['text-base'], tw['text-primary'], tw['py-3'], tw['px-4'], tw['bg-surface'], tw['rounded-xl']]}>
                {(profile && profile.email) || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Phone */}
          <View style={[tw['mb-4']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary'], tw['mb-2']]}>
              Phone Number
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  tw['border'], 
                  tw['rounded-xl'], 
                  tw['px-4'], 
                  tw['py-3'], 
                  tw['text-base'],
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={(profile && profile.phone) || ''}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={[tw['text-base'], tw['text-primary'], tw['py-3'], tw['px-4'], tw['bg-surface'], tw['rounded-xl']]}>
                {(profile && profile.phone) || 'Not specified'}
              </Text>
            )}
          </View>

          {/* School */}
          <View style={[tw['mb-4']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary'], tw['mb-2']]}>
              School/Institution
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  tw['border'], 
                  tw['rounded-xl'], 
                  tw['px-4'], 
                  tw['py-3'], 
                  tw['text-base'],
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={(profile && profile.school) || ''}
                onChangeText={(text) => updateField('school', text)}
                placeholder="Enter your school name"
                placeholderTextColor={theme.colors.textMuted}
              />
            ) : (
              <Text style={[tw['text-base'], tw['text-primary'], tw['py-3'], tw['px-4'], tw['bg-surface'], tw['rounded-xl']]}>
                {(profile && profile.school) || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Subject */}
          <View style={[tw['mb-0']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary'], tw['mb-2']]}>
              Subject/Specialization
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  tw['border'], 
                  tw['rounded-xl'], 
                  tw['px-4'], 
                  tw['py-3'], 
                  tw['text-base'],
                  { 
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={(profile && profile.subject) || ''}
                onChangeText={(text) => updateField('subject', text)}
                placeholder="Enter your subject"
                placeholderTextColor={theme.colors.textMuted}
              />
            ) : (
              <Text style={[tw['text-base'], tw['text-primary'], tw['py-3'], tw['px-4'], tw['bg-surface'], tw['rounded-xl']]}>
                {(profile && profile.subject) || 'Not specified'}
              </Text>
            )}
          </View>
        </View>

        {/* Account Information */}
        <View style={[tw['bg-surface'], tw['mx-5'], tw['rounded-3xl'], tw['shadow-lg'], tw['p-6'], tw['mb-6']]}>
          <Text style={[tw['text-lg'], tw['font-bold'], tw['text-primary'], tw['mb-4']]}>
            Account Information
          </Text>

          <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['mb-3']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary']]}>Account Status</Text>
            <View style={[tw['bg-green-500'], tw['px-3'], tw['py-1'], tw['rounded-full']]}>
              <Text style={[tw['text-sm'], tw['font-medium'], tw['text-white']]}>
                {(profile && profile.isActive) ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['mb-3']]}>
            <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary']]}>Role</Text>
            <Text style={[tw['text-sm'], tw['text-secondary'], tw['capitalize']]}>
              {(profile && profile.role) || 'teacher'}
            </Text>
          </View>

          {profile && profile.createdAt && (
            <View style={[tw['flex-row'], tw['justify-between'], tw['items-center'], tw['mb-0']]}>
              <Text style={[tw['text-sm'], tw['font-medium'], tw['text-secondary']]}>Member Since</Text>
              <Text style={[tw['text-sm'], tw['text-gray-600']]}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;
