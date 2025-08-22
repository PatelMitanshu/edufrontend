import api from './api';
import supabaseUploadService from './supabaseUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Properly format file for upload based on the file object structure
    let mimeType = data.file.type || data.file.mimeType;
    let fileName = data.file.name || data.file.fileName || data.file.originalName;
    let fileSize = data.file.fileSize || data.file.size;
    
    // For videos, ensure proper filename with extension
    if (data.type === 'video' && (!fileName || !fileName.includes('.'))) {
      // Default video extension based on MIME type or fallback to mp4
      if (mimeType) {
        if (mimeType.includes('mp4')) fileName = fileName ? `${fileName}.mp4` : 'video.mp4';
        else if (mimeType.includes('mov')) fileName = fileName ? `${fileName}.mov` : 'video.mov';
        else if (mimeType.includes('avi')) fileName = fileName ? `${fileName}.avi` : 'video.avi';
        else fileName = fileName ? `${fileName}.mp4` : 'video.mp4';
      } else {
        fileName = fileName ? `${fileName}.mp4` : 'video.mp4';
        mimeType = 'video/mp4';
      }
    }
    
    // For images, ensure proper filename with extension
    if (data.type === 'image' && (!fileName || !fileName.includes('.'))) {
      if (mimeType) {
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) fileName = fileName ? `${fileName}.jpg` : 'image.jpg';
        else if (mimeType.includes('png')) fileName = fileName ? `${fileName}.png` : 'image.png';
        else if (mimeType.includes('gif')) fileName = fileName ? `${fileName}.gif` : 'image.gif';
        else fileName = fileName ? `${fileName}.jpg` : 'image.jpg';
      } else {
        fileName = fileName ? `${fileName}.jpg` : 'image.jpg';
        mimeType = 'image/jpeg';
      }
    }
    
    // Ensure proper MIME type based on file extension if not provided
    if (!mimeType || mimeType === 'application/octet-stream') {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'xlsx':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'xls':
          mimeType = 'application/vnd.ms-excel';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'doc':
          mimeType = 'application/msword';
          break;
        case 'pptx':
          mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        case 'ppt':
          mimeType = 'application/vnd.ms-powerpoint';
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'csv':
          mimeType = 'text/csv';
          break;
        default:
          mimeType = mimeType || 'application/octet-stream';
      }
    }

    // Use direct backend upload (like lesson plans) to avoid Supabase RLS issues
    try {
      // Create FormData for direct backend upload
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('student', data.student);
      formData.append('type', data.type);
      if (data.description) formData.append('description', data.description);
      if (data.subject) formData.append('subject', data.subject);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      
      const fileData = {
        uri: data.file.uri,
        type: mimeType,
        name: fileName,
      };
      
      formData.append('file', fileData as any);

      // Make the request with extended timeout for large file uploads
      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for uploads
      });
      return response.data;
    } catch (backendError: any) {
      // Better error handling for network timeouts
      if (backendError.code === 'ECONNABORTED' || backendError.message.includes('timeout')) {
        throw new Error('Upload timeout - file may be too large or connection is slow. Please check the student profile to verify if the upload was successful.');
      }
      if (backendError.message === 'Network Error') {
        throw new Error('Network error occurred during upload. The file might have been uploaded successfully.');
      }
      
      throw backendError;
    }
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
