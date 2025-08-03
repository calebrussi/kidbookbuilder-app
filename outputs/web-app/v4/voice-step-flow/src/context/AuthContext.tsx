import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  offlineMode: boolean;
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
  const [offlineMode, setOfflineMode] = useState(!isSupabaseAvailable);

  // Helper function to create mock offline user
  const createMockOfflineUser = (email?: string, name?: string) => {
    console.log('🔌 Creating mock offline user session');
    
    // Try to get existing offline user from localStorage first
    const existingOfflineUser = localStorage.getItem('kidbookbuilder_offline_user');
    if (existingOfflineUser) {
      try {
        const userData = JSON.parse(existingOfflineUser);
        console.log('🔌 Restoring existing offline user:', userData.email);
        const mockUser = userData as User;
        const mockSession = {
          user: mockUser,
          access_token: 'offline-token',
          refresh_token: 'offline-refresh'
        } as Session;
        
        setUser(mockUser);
        setSession(mockSession);
        setOfflineMode(true);
        setLoading(false);
        return;
      } catch (error) {
        console.log('🔌 Failed to restore offline user, creating new one');
      }
    }
    
    // Create new offline user
    const userEmail = email || 'caleb@tradingcubs.com'; // Use a more specific default
    const userName = name || userEmail.split('@')[0] || 'User';
    
    // Use a simpler consistent user ID based on email
    const consistentUserId = 'offline-user-' + userEmail.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    const mockUser = {
      id: consistentUserId,
      email: userEmail,
      user_metadata: { full_name: userName },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as unknown as User;
    
    // Save to localStorage for persistence
    localStorage.setItem('kidbookbuilder_offline_user', JSON.stringify(mockUser));
    console.log('🔌 Saved offline user to localStorage:', userEmail);
    
    const mockSession = {
      user: mockUser,
      access_token: 'offline-token',
      refresh_token: 'offline-refresh'
    } as Session;
    
    setUser(mockUser);
    setSession(mockSession);
    setOfflineMode(true);
    setLoading(false);
  };

  useEffect(() => {
    // If Supabase is not available, create a mock offline user session immediately
    if (!isSupabaseAvailable || !supabase) {
      createMockOfflineUser();
      return;
    }

    // Get initial session only if Supabase is available
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // If connection fails, switch to offline mode
          setOfflineMode(true);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setOfflineMode(false);
        }
      } catch (error) {
        console.error('Supabase connection failed, switching to offline mode:', error);
        setOfflineMode(true);
        // Use the same consistent offline user creation
        createMockOfflineUser();
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes (only if Supabase is available)
    if (!offlineMode && supabase) {
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
    }
    
    // If in offline mode, no subscription to unsubscribe from
    return () => {};
  }, []);

  const createUserProfile = async (user: User) => {
    if (offlineMode || !supabase) {
      console.log('🔌 Offline mode: Skipping user profile creation');
      return;
    }
    
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
    if (offlineMode || !supabase) {
      console.log('🔌 Offline mode: Mock sign up successful for', email);
      createMockOfflineUser(email, email.split('@')[0]);
      return; // In offline mode, just pretend it worked
    }
    
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
    if (offlineMode || !supabase) {
      console.log('🔌 Offline mode: Mock sign in successful for', email);
      createMockOfflineUser(email, email.split('@')[0]);
      return; // In offline mode, just pretend it worked
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    if (offlineMode || !supabase) {
      console.log('🔌 Offline mode: Mock sign out');
      // Clear offline user session from localStorage
      localStorage.removeItem('kidbookbuilder_offline_user');
      setUser(null);
      setSession(null);
      return;
    }
    
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
      console.log('✅ Sign out successful - clearing local auth state only');
      
      // Force clear local state but preserve progress data
      setUser(null);
      setSession(null);
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      
      // For timeout errors, force sign out by clearing everything
      console.log('🔧 Forcing complete sign out due to timeout');
      setUser(null);
      setSession(null);
      
      // Clear only Supabase auth localStorage, preserve user progress data
      console.log('🗄️ Clearing authentication localStorage only (preserving progress)');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force a page refresh to login page
      console.log('🔄 Redirecting to clean login state');
      window.location.href = window.location.origin;
      
      return; // Don't throw error since we're handling it
    }
  };

  const resetPassword = async (email: string) => {
    if (offlineMode || !supabase) {
      console.log('🔌 Offline mode: Mock password reset');
      return; // In offline mode, just pretend it worked
    }
    
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
    offlineMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
