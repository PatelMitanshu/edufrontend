import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

export interface LessonPlanMaterial {
  type: 'photo' | 'video' | 'text' | 'link' | 'document';
  content: string;
  title?: string;
}

export interface LessonPlan {
  _id?: string;
  id?: string;
  teacherId?: string;
  subject: string;
  topic: string;
  date: string;
  startTime: string;
  duration: number;
  description?: string;
  materials: LessonPlanMaterial[];
  completed: boolean;
  completedAt?: string;
  standardId?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonPlanStats {
  total: number;
  completed: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  completionRate: number;
}

class LessonPlanService {
  private baseURL = `${API_URL}/lesson-plans`;

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // Get all lesson plans with optional filters
  async getLessonPlans(filters?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    completed?: boolean;
  }): Promise<LessonPlan[]> {
    try {
      const headers = await this.getAuthHeaders();
      let url = this.baseURL;
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.completed !== undefined) params.append('completed', filters.completed.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lesson plans');
      }

      // Convert _id to id for frontend compatibility
      const lessonPlans = data.data.map((plan: any) => ({
        ...plan,
        id: plan._id,
      }));

      return lessonPlans;
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
      throw error;
    }
  }

  // Get today's lesson plans
  async getTodaysLessonPlans(): Promise<LessonPlan[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/today`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch today\'s lesson plans');
      }

      // Convert _id to id for frontend compatibility
      const lessonPlans = data.data.map((plan: any) => ({
        ...plan,
        id: plan._id,
      }));

      return lessonPlans;
    } catch (error) {
      console.error('Error fetching today\'s lesson plans:', error);
      throw error;
    }
  }

  // Get specific lesson plan by ID
  async getLessonPlan(id: string): Promise<LessonPlan> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lesson plan');
      }

      return {
        ...data.data,
        id: data.data._id,
      };
    } catch (error) {
      console.error('Error fetching lesson plan:', error);
      throw error;
    }
  }

  // Create new lesson plan
  async createLessonPlan(lessonPlan: Omit<LessonPlan, 'id' | '_id' | 'completed' | 'createdAt' | 'updatedAt'>): Promise<LessonPlan> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(lessonPlan),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create lesson plan');
      }

      return {
        ...data.data,
        id: data.data._id,
      };
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      throw error;
    }
  }

  // Update lesson plan
  async updateLessonPlan(id: string, updates: Partial<LessonPlan>): Promise<LessonPlan> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update lesson plan');
      }

      return {
        ...data.data,
        id: data.data._id,
      };
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      throw error;
    }
  }

  // Toggle lesson plan completion
  async toggleLessonPlanCompletion(id: string): Promise<{ id: string; completed: boolean; completedAt?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}/toggle-completion`, {
        method: 'PATCH',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle lesson plan completion');
      }

      return {
        id: data.data.id,
        completed: data.data.completed,
        completedAt: data.data.completedAt,
      };
    } catch (error) {
      console.error('Error toggling lesson plan completion:', error);
      throw error;
    }
  }

  // Delete lesson plan
  async deleteLessonPlan(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete lesson plan');
      }
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  // Get lesson plan statistics
  async getLessonPlanStats(): Promise<LessonPlanStats> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/stats/summary`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lesson plan statistics');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching lesson plan stats:', error);
      throw error;
    }
  }

  // Delete a specific material from lesson plan
  async deleteMaterial(lessonPlanId: string, materialIndex?: number, materialContent?: string): Promise<LessonPlan> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/${lessonPlanId}/material`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({
          materialIndex,
          materialContent
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete material');
      }

      return {
        ...data.data,
        id: data.data._id,
      };
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // Utility function to format date for API
  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Utility function to format time for API
  static formatTimeForAPI(date: Date): string {
    return date.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  }
}

export const lessonPlanService = new LessonPlanService();
