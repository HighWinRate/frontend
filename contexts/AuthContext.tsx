'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    
    async function initializeAuth() {
      // Check for token in localStorage first (from backend API)
      const token = apiClient.getToken();
      
      if (token) {
        // We have a token, try to get user info from Supabase session or backend
        try {
          // First try Supabase session (faster)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user) {
            // We have a Supabase session, get full user from backend
            try {
              const fullUser = await apiClient.getUser(session.user.id);
              if (isMounted) {
                setUser(fullUser);
                setLoading(false);
              }
            } catch (userError) {
              // If backend user fetch fails, try to decode token or use session data
              console.warn('[AuthContext] Failed to fetch user from backend, using session data:', userError);
              // Create a minimal user object from session
              if (isMounted && session.user) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  first_name: session.user.user_metadata?.first_name || '',
                  last_name: session.user.user_metadata?.last_name || '',
                  role: session.user.user_metadata?.role || 'user',
                } as User);
                setLoading(false);
              }
            }
          } else {
            // No Supabase session, but we have a token
            // This shouldn't happen normally, but handle it gracefully
            console.warn('[AuthContext] Token exists but no Supabase session found');
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('[AuthContext] Error initializing auth:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } else {
        // No token, check Supabase session as fallback
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session && session.user) {
            apiClient.setToken(session.access_token);
            // Try to get user from backend
            try {
              const fullUser = await apiClient.getUser(session.user.id);
              if (isMounted) {
                setUser(fullUser);
                setLoading(false);
              }
            } catch (userError) {
              // Fallback to session data
              if (isMounted && session.user) {
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  first_name: session.user.user_metadata?.first_name || '',
                  last_name: session.user.user_metadata?.last_name || '',
                  role: session.user.user_metadata?.role || 'user',
                } as User);
                setLoading(false);
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        } catch (error) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    }
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    // First sign in with Supabase to get session
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (supabaseError || !supabaseData.session || !supabaseData.user) {
      throw new Error(supabaseError?.message || 'Invalid credentials');
    }
    
    // Now use backend API for login (which handles user profile creation/updates)
    // This ensures backend has the latest user info
    const response = await apiClient.login({ email, password });
    
    if (response.access_token && response.user) {
      // Set token in API client (use Supabase token for consistency)
      apiClient.setToken(supabaseData.session.access_token);
      
      // Set user from backend response (has latest data)
      setUser(response.user);
    } else {
      // Even if backend fails, we still have Supabase session
      // Use Supabase user data as fallback
      setUser({
        id: supabaseData.user.id,
        email: supabaseData.user.email || email,
        first_name: supabaseData.user.user_metadata?.first_name || '',
        last_name: supabaseData.user.user_metadata?.last_name || '',
        role: supabaseData.user.user_metadata?.role || 'user',
      } as User);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // Use backend API for registration (which handles Supabase Auth and user profile creation)
    const response = await apiClient.register({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    if (response.access_token && response.user) {
      // Set token in API client
      apiClient.setToken(response.access_token);
      
      // Set user from backend response
      setUser(response.user);
    } else {
      // Email confirmation required - backend didn't return session
      // User will be created when they confirm email and login
      setUser(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    apiClient.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

