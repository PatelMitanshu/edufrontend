import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  school: string;
  subject: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface ProfileSettings {
  notifications: {
    email: boolean;
    push: boolean;
    studentUpdates: boolean;
    systemAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'school';
    shareData: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  school?: string;
  subject?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class ProfileService {
  // Get teacher profile
  async getProfile(): Promise<TeacherProfile> {
    try {
      const response = await api.get('/profile/profile');
      return response.data.data.teacher;
    } catch (error) {
      throw error;
    }
  }

  // Update teacher profile
  async updateProfile(profileData: ProfileUpdateData): Promise<TeacherProfile> {
    try {
      const response = await api.put('/profile/profile', profileData);
      
      // Update local storage with new data
      await AsyncStorage.setItem('teacherData', JSON.stringify(response.data.data.teacher));
      
      return response.data.data.teacher;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    try {
      await api.put('/profile/change-password', passwordData);
    } catch (error) {
      throw error;
    }
  }

  // Get profile settings
  async getSettings(): Promise<ProfileSettings> {
    try {
      const response = await api.get('/profile/settings');
      return response.data.settings;
    } catch (error) {
      throw error;
    }
  }

  // Update profile settings
  async updateSettings(settings: ProfileSettings): Promise<ProfileSettings> {
    try {
      const response = await api.put('/profile/settings', { settings });
      return response.data.settings;
    } catch (error) {
      throw error;
    }
  }
}

export const profileService = new ProfileService();
export type { TeacherProfile, ProfileSettings, ProfileUpdateData, ChangePasswordData };
