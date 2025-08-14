import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_API_ENDPOINT } from '../config/network';

const API_BASE_URL = `${CURRENT_API_ENDPOINT}/api`;

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MCQTest {
  _id: string;
  title: string;
  description: string;
  standardId: string;
  questions: MCQQuestion[];
  questionsCount: number;
  createdAt: string;
}

interface GenerateMCQRequest {
  image: any;
  questionCount: string;
  bookLanguage: string;
  questionLanguage: string;
  standardId: string;
}

interface SaveMCQRequest {
  standardId: string;
  questions: MCQQuestion[];
  title?: string;
  description?: string;
}

class MCQService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getAuthHeaders() {
    const token = await this.getAuthToken();
    console.log('Auth token for headers:', token ? `${token.substring(0, 20)}...` : 'No token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async getMultipartHeaders() {
    const token = await this.getAuthToken();
    console.log('Auth token for multipart:', token ? `${token.substring(0, 20)}...` : 'No token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    };
  }

  // Test authentication
  async testAuth(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await this.getAuthToken();
      console.log('Testing auth with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const headers = await this.getAuthHeaders();
      console.log('Testing auth with URL:', `${API_BASE_URL}/standards`);

      // Test with existing standards endpoint that requires auth
      const response = await fetch(`${API_BASE_URL}/standards`, {
        method: 'GET',
        headers,
      });

      console.log('Auth test response status:', response.status);
      const result = await response.json();
      console.log('Auth test response:', result);

      if (response.ok) {
        return { success: true, message: 'Authentication successful' };
      } else {
        return { success: false, message: result.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Auth test error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Auth test failed' };
    }
  }

  // Check MCQ service status
  async checkServiceStatus(): Promise<{ success: boolean; status: string; message: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/mcq/status`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      
      if (response.ok) {
        return { 
          success: true, 
          status: result.status, 
          message: result.message 
        };
      } else {
        return { 
          success: false, 
          status: result.status || 'error', 
          message: result.message || 'Service check failed' 
        };
      }
    } catch (error) {
      console.error('Service status check error:', error);
      return { 
        success: false, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Service check failed' 
      };
    }
  }

  // Generate MCQ questions from book image
  async generateMCQ(data: GenerateMCQRequest): Promise<{ questions: MCQQuestion[] }> {
    try {
      const token = await this.getAuthToken();
      console.log('Auth token retrieved:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const formData = new FormData();
      formData.append('image', {
        uri: data.image,
        type: 'image/jpeg',
        name: 'book_image.jpg',
      } as any);
      formData.append('questionCount', data.questionCount);
      formData.append('bookLanguage', data.bookLanguage);
      formData.append('questionLanguage', data.questionLanguage);
      formData.append('standardId', data.standardId);

      const headers = await this.getMultipartHeaders();
      const { 'Content-Type': removed, ...headersWithoutContentType } = headers; // Let fetch set the boundary for multipart

      console.log('Making request to:', `${API_BASE_URL}/mcq/generate`);
      console.log('Request headers:', headersWithoutContentType);

      const response = await fetch(`${API_BASE_URL}/mcq/generate`, {
        method: 'POST',
        headers: headersWithoutContentType,
        body: formData,
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 503 && result.retryable) {
          const error = new Error(result.message || 'AI service is temporarily overloaded');
          (error as any).retryable = true;
          (error as any).suggestedRetryDelay = result.suggestedRetryDelay || 60000;
          throw error;
        }
        
        throw new Error(result.message || 'Failed to generate MCQ questions');
      }

      return { questions: result.questions };
    } catch (error) {
      console.error('Error generating MCQ:', error);
      throw error;
    }
  }

  // Save MCQ test
  async saveMCQTest(data: SaveMCQRequest): Promise<{ success: boolean; mcqId: string }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save MCQ test');
      }

      return { success: result.success, mcqId: result.mcqId };
    } catch (error) {
      console.error('Error saving MCQ test:', error);
      throw error;
    }
  }

  // Get MCQ tests for a standard
  async getMCQTests(standardId: string): Promise<MCQTest[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq/standard/${standardId}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch MCQ tests');
      }

      return result.mcqTests;
    } catch (error) {
      console.error('Error fetching MCQ tests:', error);
      throw error;
    }
  }

  // Get specific MCQ test
  async getMCQTest(mcqId: string): Promise<MCQTest> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq/${mcqId}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch MCQ test');
      }

      return result.mcqTest;
    } catch (error) {
      console.error('Error fetching MCQ test:', error);
      throw error;
    }
  }

  // Delete MCQ test
  async deleteMCQTest(mcqId: string): Promise<{ success: boolean }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq/${mcqId}`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete MCQ test');
      }

      return { success: result.success };
    } catch (error) {
      console.error('Error deleting MCQ test:', error);
      throw error;
    }
  }

  async updateMCQTest(mcqId: string, data: SaveMCQRequest): Promise<{ success: boolean; mcqId: string }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq/${mcqId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update MCQ test');
      }

      return { success: result.success, mcqId: result.mcqId };
    } catch (error) {
      console.error('Error updating MCQ test:', error);
      throw error;
    }
  }
}

export const mcqService = new MCQService();
export type { MCQQuestion, MCQTest, GenerateMCQRequest, SaveMCQRequest };
