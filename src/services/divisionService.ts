import api from './api';

export interface Division {
  _id: string;
  name: string; // e.g., "A", "B", "C"
  fullName: string; // e.g., "8-A", "8-B", "8-C"
  standard: {
    _id: string;
    name: string;
  };
  description?: string;
  studentCount: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDivisionData {
  name: string; // Division letter/name (A, B, C, etc.)
  description?: string;
  standardId: string;
}

export const divisionService = {
  async getDivisionsByStandard(standardId: string): Promise<{ divisions: Division[] }> {
    const response = await api.get(`/divisions/by-standard/${standardId}`);
    return response.data;
  },

  async getDivision(id: string): Promise<{ division: Division }> {
    const response = await api.get(`/divisions/${id}`);
    return response.data;
  },

  async createDivision(data: CreateDivisionData): Promise<{ division: Division }> {
    const response = await api.post('/divisions', data);
    return response.data;
  },

  async updateDivision(id: string, data: Partial<CreateDivisionData>): Promise<{ division: Division }> {
    const response = await api.put(`/divisions/${id}`, data);
    return response.data;
  },

  async deleteDivision(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/divisions/${id}`);
    return response.data;
  },
};
