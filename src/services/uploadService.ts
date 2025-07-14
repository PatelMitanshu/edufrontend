import api from './api';

export interface Upload {
  _id: string;
  title: string;
  description?: string;
  student: {
    _id: string;
    name: string;
    standard: string;
  };
  type: 'video' | 'document' | 'image';
  file: {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  subject?: string;
  tags: string[];
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUploadData {
  title: string;
  student: string;
  type: 'video' | 'document' | 'image';
  description?: string;
  subject?: string;
  tags?: string[];
  file: any; // FormData file
}

export const uploadService = {
  async getUploadsForStudent(studentId: string, params?: { 
    type?: string; 
    page?: number; 
    limit?: number;
  }): Promise<{
    uploads: Upload[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }> {
    const response = await api.get(`/uploads/student/${studentId}`, { params });
    return response.data;
  },

  async getUpload(id: string): Promise<{ upload: Upload }> {
    const response = await api.get(`/uploads/${id}`);
    return response.data;
  },

  async createUpload(data: CreateUploadData): Promise<{ upload: Upload }> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('student', data.student);
    formData.append('type', data.type);
    if (data.description) formData.append('description', data.description);
    if (data.subject) formData.append('subject', data.subject);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    
    // Properly format file for upload based on the file object structure
    const fileData = {
      uri: data.file.uri,
      type: data.file.type || data.file.mimeType,
      name: data.file.name || data.file.fileName || data.file.originalName || 'upload',
    };
    
    formData.append('file', fileData as any);

    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateUpload(id: string, data: {
    title?: string;
    description?: string;
    subject?: string;
    tags?: string[];
  }): Promise<{ upload: Upload }> {
    const response = await api.put(`/uploads/${id}`, data);
    return response.data;
  },

  async deleteUpload(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/uploads/${id}`);
    return response.data;
  },
};
