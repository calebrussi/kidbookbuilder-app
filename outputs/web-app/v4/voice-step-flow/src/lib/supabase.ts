import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a flag to track if Supabase is available
export let isSupabaseAvailable = false;

let supabaseClient: any = null;

// Check if we can reach Supabase (simple check for localhost development)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const hasSupabaseEnv = supabaseUrl && supabaseAnonKey;

console.log('🔧 Supabase initialization check:', { isLocalhost, hasSupabaseEnv, supabaseUrl });

if (!hasSupabaseEnv) {
  console.warn('⚠️ Missing Supabase environment variables - running in offline mode');
  isSupabaseAvailable = false;
} else if (isLocalhost) {
  // For localhost, force offline mode to avoid connection issues
  console.log('🔌 Localhost detected - forcing offline mode to avoid connection issues');
  
  // Clear any existing Supabase session data to prevent connection attempts
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
      console.log('🗑️ Cleared Supabase localStorage:', key);
    }
  });
  
  isSupabaseAvailable = false;
  supabaseClient = null;
} else {
  try {
    // Only create Supabase client in production with proper connection
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // Disable auto-refresh to prevent infinite loops
        persistSession: true,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'x-client-info': 'kidbookbuilder-webapp'
        }
      }
    });
    
    isSupabaseAvailable = true;
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    isSupabaseAvailable = false;
    supabaseClient = null;
  }
}

export const supabase = supabaseClient;

// Types for our database
export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
