import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qdvdptbkzlpzcormseaz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmRwdGJremxwemNvcm1zZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NzkxOTIsImV4cCI6MjA3MTM1NTE5Mn0.5xGAIHzKinP9NNJjAEjo_4d7D3dAUaeU75OCUrzLN60';
const STORAGE_BUCKET = 'edulearner';

// Configuration: Set to false to always use backend upload (recommended for React Native)
const ENABLE_DIRECT_SUPABASE_UPLOAD = true;

export interface SupabaseUploadResult {
  url: string;
  path: string;
  error?: string;
}

class SupabaseUploadService {
  private supabaseClient: SupabaseClient | null = null;

  /**
   * Initialize Supabase client lazily
   * @returns SupabaseClient | null
   */
  private getSupabaseClient(): SupabaseClient | null {
    if (!this.supabaseClient) {
      try {
        // Check if required modules are available
        if (typeof createClient !== 'function') {
          console.error('❌ createClient is not available');
          return null;
        }
        
        this.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false, // Disable session persistence for React Native
            autoRefreshToken: false
          },
          global: {
            fetch: (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
              console.log('🌐 Supabase fetch request:', {
                url: url.toString(),
                method: options.method || 'GET',
                headers: options.headers,
                hasBody: !!options.body
              });
              
              // Add timeout and better error handling for React Native
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 30000)
              );
              
              const fetchPromise = fetch(url, {
                ...options,
                headers: {
                  ...options.headers,
                  'User-Agent': 'edulearn-mobile-app/1.0',
                },
              });
              
              return Promise.race([fetchPromise, timeoutPromise])
                .then((response: Response) => {
                  return response;
                })
                .catch(error => {
                  console.error('❌ Supabase fetch error:', error);
                  throw error;
                });
            }
          }
        });
        // Test bucket access immediately
        this.testBucketAccess();
        
      } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        this.supabaseClient = null;
      }
    }
    return this.supabaseClient;
  }

  /**
   * Test bucket access to diagnose RLS issues
   */
  private async testBucketAccess(): Promise<void> {
    try {
      if (!this.supabaseClient) return;
      const { data, error } = await this.supabaseClient.storage
        .from(STORAGE_BUCKET)
        .list('', { limit: 1 });
      
      if (error) {
        console.error('❌ Bucket access failed (likely RLS policy issue):', error.message);
      } else {
      }
    } catch (error) {
      console.error('❌ Bucket test failed:', error);
    }
  }

  /**
   * Upload a file to Supabase Storage
   * @param file - The file to upload (from react-native-image-picker or document picker)
   * @param folderPath - The folder path where to store the file
   * @param fileName - Optional custom filename
   * @returns Promise<SupabaseUploadResult>
   */
  async uploadFile(
    file: any, 
    folderPath: string, 
    fileName?: string
  ): Promise<SupabaseUploadResult> {
    
    // Skip direct Supabase upload if disabled
    if (!ENABLE_DIRECT_SUPABASE_UPLOAD) {
      throw new Error('Direct upload disabled - use backend fallback');
    }
    
    try {
      // Check if supabase client is available
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      console.log('File info:', {
        name: file.fileName || file.name,
        type: file.type,
        size: file.fileSize || file.size,
        uri: file.uri?.substring(0, 50) + '...'
      });

      // Generate unique filename if not provided
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substr(2, 9);
      const originalName = file.fileName || file.name || 'file';
      const extension = originalName.split('.').pop() || 'file';
      const finalFileName = fileName || `${timestamp}-${randomString}.${extension}`;
      
      // Full path in Supabase Storage
      const filePath = `${folderPath}/${finalFileName}`;
      // Convert file to blob for upload
      const fileBlob = await this.fileToBlob(file);
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileBlob, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
          duplex: 'half' // Add this for React Native compatibility
        });

      if (error) {
        console.error('❌ Supabase upload error details:', {
          message: error.message,
          name: error.name,
          details: JSON.stringify(error, null, 2)
        });
        throw error;
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Supabase upload error:', error);
      return {
        url: '',
        path: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload profile picture
   * @param imageFile - Image file from image picker
   * @param userId - User ID
   * @param userType - 'teacher' or 'student'
   * @returns Promise<SupabaseUploadResult>
   */
  async uploadProfilePicture(
    imageFile: any, 
    userId: string, 
    userType: 'teacher' | 'student'
  ): Promise<SupabaseUploadResult> {
    const folderPath = `profiles/${userType}s/${userId}`;
    return this.uploadFile(imageFile, folderPath);
  }

  /**
   * Upload student document/media
   * @param file - File to upload
   * @param studentId - Student ID
   * @param teacherId - Teacher ID
   * @param uploadType - Type of upload (video, document, image)
   * @returns Promise<SupabaseUploadResult>
   */
  async uploadStudentFile(
    file: any,
    studentId: string,
    teacherId: string,
    uploadType: 'video' | 'document' | 'image'
  ): Promise<SupabaseUploadResult> {
    const folderPath = `student-uploads/${teacherId}/${studentId}/${uploadType}`;
    return this.uploadFile(file, folderPath);
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Path of the file to delete
   * @returns Promise<boolean>
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not initialized');
        return false;
      }

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  /**
   * Convert file object to Blob for upload
   * @private
   */
  private async fileToBlob(file: any): Promise<Blob> {
    if (file.uri) {
      // For React Native file objects with URI
      const response = await fetch(file.uri);
      return await response.blob();
    } else if (file instanceof Blob) {
      return file;
    } else {
      throw new Error('Unsupported file format');
    }
  }

  /**
   * Get signed URL for private files
   * @param filePath - Path of the file
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise<string>
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not initialized');
        return '';
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl || '';
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return '';
    }
  }
}

export default new SupabaseUploadService();
