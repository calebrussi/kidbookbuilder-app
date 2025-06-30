import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true, // Start with loading true while checking session
    error: null,
  });

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message 
        }));
        return;
      }

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: !!session,
        user: session?.user || null,
        loading: false,
        error: null,
      }));
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: !!session,
          user: session?.user || null,
          loading: false,
          error: null,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const authenticate = async (email: string, password: string, isSignUp: boolean = false) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let result;
      
      if (isSignUp) {
        // Sign up new user
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Use email prefix as initial name
            }
          }
        });
      } else {
        // Sign in existing user
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        throw result.error;
      }

      // For signup, show success message even if email confirmation is pending
      if (isSignUp && !result.data.session) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Please check your email to confirm your account before signing in.' 
        }));
        return;
      }

      // Success - the onAuthStateChange listener will handle updating the state
      setAuthState(prev => ({ ...prev, loading: false, error: null }));

    } catch (error: any) {
      console.error('Authentication error:', error);
      let errorMessage = 'Authentication failed';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // The onAuthStateChange listener will handle updating the state
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
    }
  };

  return {
    ...authState,
    authenticate,
    signOut,
  };
};
