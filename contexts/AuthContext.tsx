'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/data/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createFallbackUser = useCallback((sessionUser: SupabaseUser): User => ({
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    first_name: (sessionUser.user_metadata as any)?.first_name ?? '',
    last_name: (sessionUser.user_metadata as any)?.last_name ?? '',
    role: ((sessionUser.user_metadata as any)?.role as User['role']) ?? 'user',
  }), []);

  const fetchProfile = useCallback(
    async (userId: string | null, sessionUser?: SupabaseUser): Promise<User | null> => {
      if (!userId) {
        setUser(null);
        return null;
      }

      try {
        console.log('Fetching user profile for:', userId);
        const profile = await getUserProfile(supabase, userId);
        
        if (profile) {
          console.log('Profile found:', profile);
          setUser(profile);
          return profile;
        }

        console.warn('No profile found in database, using fallback from session');
        if (sessionUser) {
          const fallbackUser = createFallbackUser(sessionUser);
          setUser(fallbackUser);
          return fallbackUser;
        }

        console.error('No profile and no session user available');
        setUser(null);
        return null;
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (sessionUser) {
          console.warn('Using fallback user due to error');
          const fallbackUser = createFallbackUser(sessionUser);
          setUser(fallbackUser);
          return fallbackUser;
        }
        setUser(null);
        return null;
      }
    },
    [supabase, createFallbackUser],
  );

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!isMounted) return;

      if (error) {
        console.error('Failed to load Supabase session:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        await fetchProfile(session.user.id, session.user);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        throw new Error(error.message);
      }

      const sessionUser = data.user || data.session?.user;
      if (sessionUser && data.session) {
        await fetchProfile(sessionUser.id, sessionUser);
      }

      setLoading(false);
    },
    [supabase, fetchProfile],
  );

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'user',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session?.user) {
        await fetchProfile(data.session.user.id);
      } else {
        setUser(null);
      }
    },
    [supabase, fetchProfile],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const profile = await fetchProfile(session?.user?.id || null);
    return profile;
  }, [fetchProfile, supabase]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
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

