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
    
    // Check for token in localStorage first (from backend API)
    const token = apiClient.getToken();
    
    if (token) {
      // We have a token, but don't fetch user immediately
      // Let the first API call handle user fetching to avoid loops
      // Just set loading to false
      setLoading(false);
    } else {
      // No token, check Supabase session as fallback (only once, no retries)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        
        if (session) {
          apiClient.setToken(session.access_token);
          // Try to get user, but don't retry on failure to prevent loops
          apiClient.getUser(session.user.id)
            .then((fullUser) => {
              if (isMounted) {
                setUser(fullUser);
                setLoading(false);
              }
            })
            .catch(() => {
              // Silently fail - don't retry to prevent loops
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            });
        } else {
          if (isMounted) {
            setLoading(false);
          }
        }
      }).catch(() => {
        // Silently fail to prevent loops
        if (isMounted) {
          setLoading(false);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };

    // Disable onAuthStateChange to prevent loops
    // We'll handle auth state through backend API calls only
    // This prevents the rapid refresh issue
  }, []);

  const login = async (email: string, password: string) => {
    // Use backend API for login (which handles Supabase Auth and user profile creation)
    const response = await apiClient.login({ email, password });
    
    if (response.access_token && response.user) {
      // Set token in API client
      apiClient.setToken(response.access_token);
      
      // Set user from backend response
      setUser(response.user);
    } else {
      throw new Error('Login failed - no token or user returned');
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

