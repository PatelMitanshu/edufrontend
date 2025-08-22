import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdvdptbkzlpzcormseaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmRwdGJremxwemNvcm1zZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NzkxOTIsImV4cCI6MjA3MTM1NTE5Mn0.5xGAIHzKinP9NNJjAEjo_4d7D3dAUaeU75OCUrzLN60';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

// Create Supabase client with React Native optimized settings
let supabase: SupabaseClient | null = null;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable session persistence for React Native
      autoRefreshToken: false, // Disable auto refresh in RN
      detectSessionInUrl: false // Disable URL session detection
    }
  });
  // Test storage access
  if (supabase.storage) {
  } else {
    console.warn('⚠️ Supabase Storage service not available');
  }
  
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  supabase = null;
}

// Safe getter function
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabase) {
    console.warn('⚠️ Supabase client not available');
  }
  return supabase;
}

export { supabase };
export const STORAGE_BUCKET = 'edulearner';
