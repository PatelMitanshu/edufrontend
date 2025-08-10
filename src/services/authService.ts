import api from './api';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  lastLogin?: Date;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  teacher: Teacher;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export const authService = {
  async login(data: LoginData): Promise<LoginResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async getProfile(): Promise<{ teacher: Teacher }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: { name?: string }): Promise<{ teacher: Teacher }> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  async sendPasswordResetOTP(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyPasswordResetOTP(email: string, otp: string): Promise<ForgotPasswordResponse> {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ForgotPasswordResponse> {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },
};
