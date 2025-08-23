import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qdvdptbkzlpzcormseaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdmRwdGJremxwemNvcm1zZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NzkxOTIsImV4cCI6MjA3MTM1NTE5Mn0.5xGAIHzKinP9NNJjAEjo_4d7D3dAUaeU75OCUrzLN60';

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {}

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
  } else {}
  
} catch (error) {if (error instanceof Error) {}
  supabase = null;
}

// Safe getter function
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabase) {}
  return supabase;
}

export { supabase };
export const STORAGE_BUCKET = 'edulearner';
