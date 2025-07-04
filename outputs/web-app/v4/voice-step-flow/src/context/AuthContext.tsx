import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle user profile creation on sign up
      if (event === 'SIGNED_IN' && session?.user) {
        await createUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created successfully');
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0], // Use email prefix as default name
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Starting sign out process...');
    try {
      console.log('📞 Calling supabase.auth.signOut()...');
      
      // Add a timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      console.log('📝 Sign out response received');
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      console.log('✅ Sign out successful - clearing local state');
      
      // Force clear local state even if Supabase call hangs
      setUser(null);
      setSession(null);
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      
      // For timeout errors, force sign out by clearing everything
      console.log('🔧 Forcing complete sign out due to timeout');
      setUser(null);
      setSession(null);
      
      // Clear all localStorage to ensure clean state
      localStorage.clear();
      
      // Force a page refresh to login page
      console.log('🔄 Redirecting to clean login state');
      window.location.href = window.location.origin;
      
      return; // Don't throw error since we're handling it
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
