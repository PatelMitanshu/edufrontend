import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_API_ENDPOINT } from '../config/network';

const API_BASE_URL = `${CURRENT_API_ENDPOINT}/api`;

interface MCQTest {
  _id: string;
  title: string;
  description: string;
  questionsCount: number;
  createdAt: string;
  timeLimit: number;
  hasAttempted: boolean;
  score?: number;
  percentage?: number;
  grade?: string;
  completedAt?: string;
  timeTaken?: string;
}

interface MCQQuestion {
  index: number;
  question: string;
  options: string[];
}

interface TestSubmission {
  studentId: string;
  mcqId: string;
  answers: {
    selectedAnswer: number;
    timeTaken?: number;
  }[];
  timeTaken: number;
  startedAt: string;
}

interface TestResult {
  submissionId: string;
  score: number;
  percentage: number;
  grade: string;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  timeTaken: string;
  detailedResults: {
    question: string;
    options: string[];
    correctAnswer: number;
    studentAnswer: number;
    isCorrect: boolean;
    explanation: string;
  }[];
  analysis: {
    performance: {
      score: number;
      percentage: number;
      grade: string;
    };
    timing: {
      totalTime: number;
      formattedTime: string;
      averageTimePerQuestion: number;
    };
    accuracy: {
      correct: number;
      incorrect: number;
      total: number;
      accuracyRate: number;
    };
  };
}

class StudentMCQService {
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
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get available MCQ tests for a student
  async getAvailableTests(studentId: string): Promise<{ tests: MCQTest[]; student: any }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq-student/student/${studentId}/available-tests`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch available tests');
      }

      return result;
    } catch (error) {
      console.error('Error fetching available tests:', error);
      throw error;
    }
  }

  // Get MCQ test questions for student
  async getTestQuestions(mcqId: string, studentId: string): Promise<{
    mcqTest: {
      _id: string;
      title: string;
      description: string;
      questionsCount: number;
      timeLimit: number;
      questions: MCQQuestion[];
    };
  }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq-student/student/test/${mcqId}?studentId=${studentId}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch test questions');
      }

      return result;
    } catch (error) {
      console.error('Error fetching test questions:', error);
      throw error;
    }
  }

  // Submit test answers
  async submitTest(submission: TestSubmission): Promise<{ result: TestResult }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq-student/student/submit-test`, {
        method: 'POST',
        headers,
        body: JSON.stringify(submission),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit test');
      }

      return result;
    } catch (error) {
      console.error('Error submitting test:', error);
      throw error;
    }
  }

  // Get student's test history
  async getTestHistory(studentId: string): Promise<{
    testHistory: {
      _id: string;
      mcqTest: {
        _id: string;
        title: string;
        description: string;
      };
      score: number;
      percentage: number;
      grade: string;
      correctAnswers: number;
      totalQuestions: number;
      timeTaken: string;
      completedAt: string;
    }[];
  }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq-student/student/${studentId}/test-history`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch test history');
      }

      return result;
    } catch (error) {
      console.error('Error fetching test history:', error);
      throw error;
    }
  }

  // Get specific test result details
  async getTestResult(submissionId: string): Promise<{
    result: {
      submission: any;
      mcqTest: any;
      student: any;
      detailedAnswers: any[];
      analysis: any;
    };
  }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/mcq-student/student/test-result/${submissionId}`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch test result');
      }

      return result;
    } catch (error) {
      console.error('Error fetching test result:', error);
      throw error;
    }
  }
}

export const studentMCQService = new StudentMCQService();
export type { MCQTest, MCQQuestion, TestSubmission, TestResult };
