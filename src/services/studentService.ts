import api from './api';

export interface Student {
  _id: string;
  name: string;
  standard: {
    _id: string;
    name: string;
    description?: string;
    subjects: string[];
  };
  division: {
    _id: string;
    name: string;
    fullName: string;
  };
  rollNumber?: string;
  dateOfBirth?: string;
  parentContact?: {
    phone?: string;
    email?: string;
  };
  profilePicture?: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  name: string;
  standard: string;
  division: string;
  rollNumber?: string;
  dateOfBirth?: string;
  parentContact?: {
    phone?: string;
    email?: string;
  };
}

export const studentService = {
  async getStudents(params?: { standard?: string; page?: number; limit?: number }): Promise<{
    students: Student[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const response = await api.get('/students', { params });
    return response.data;
  },

  async getStudentsByStandard(standardId: string): Promise<{ students: Student[] }> {
    const response = await api.get(`/students/by-standard/${standardId}`);
    return response.data;
  },

  async getStudentsByDivision(divisionId: string): Promise<{ students: Student[] }> {
    const response = await api.get(`/students/by-division/${divisionId}`);
    return response.data;
  },

  async getStudent(id: string): Promise<{ student: Student }> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async createStudent(data: CreateStudentData): Promise<{ student: Student }> {
    const response = await api.post('/students', data);
    return response.data;
  },

  async updateStudent(id: string, data: Partial<CreateStudentData>): Promise<{ student: Student }> {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  async deleteStudent(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
