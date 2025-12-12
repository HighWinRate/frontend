'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';

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

  useEffect(() => {
    // Check if user is logged in
    const token = apiClient.getToken();
    if (token) {
      // Try to decode JWT to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        
        // Fetch full user data from API
        apiClient.getUser(userId)
          .then((fullUser) => {
            setUser(fullUser);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Error fetching user data:', error);
            // If fetch fails (e.g., 401/403), don't set user - let it redirect
            if (error?.status === 401 || error?.status === 403) {
              // Token might be invalid, clear it
              apiClient.logout();
              setUser(null);
            } else {
              // For other errors, use basic info from token
              setUser({
                id: userId,
                email: payload.email || '',
                first_name: '',
                last_name: '',
                role: payload.role || 'user',
              });
            }
            setLoading(false);
          });
      } catch (error) {
        console.error('Error decoding token:', error);
        // If token is invalid, clear it
        apiClient.logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    setUser(response.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await apiClient.register({ email, password, first_name: firstName, last_name: lastName });
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    setUser(response.user);
  };

  const logout = () => {
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

