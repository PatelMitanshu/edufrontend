import api from './api';

export interface Teacher {
  id: string;
  name: string;
  email: string;
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
};
