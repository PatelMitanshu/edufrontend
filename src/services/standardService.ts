import api from './api';

export interface Standard {
  _id: string;
  name: string;
  description?: string;
  subjects: string[];
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandardData {
  name: string;
  description?: string;
  subjects?: string[];
}

export const standardService = {
  async getStandards(): Promise<{ standards: Standard[] }> {
    const response = await api.get('/standards');
    return response.data;
  },

  async getStandard(id: string): Promise<{ standard: Standard }> {
    const response = await api.get(`/standards/${id}`);
    return response.data;
  },

  async createStandard(data: CreateStandardData): Promise<{ standard: Standard }> {
    const response = await api.post('/standards', data);
    return response.data;
  },

  async updateStandard(id: string, data: Partial<CreateStandardData>): Promise<{ standard: Standard }> {
    const response = await api.put(`/standards/${id}`, data);
    return response.data;
  },

  async deleteStandard(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/standards/${id}`);
    return response.data;
  },
};
