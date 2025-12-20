'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { login, isAuthenticated, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // Skip on initial mount - only redirect if user becomes authenticated after mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // But still check if user is already authenticated on mount
      if (isAuthenticated && user && pathname === '/login') {
        hasRedirected.current = true;
        router.replace('/dashboard');
        setIsLoading(false);
      }
      return;
    }

    // Only redirect if user is actually authenticated (not just loading)
    // Use a ref to prevent multiple redirects
    if (isAuthenticated && user && !hasRedirected.current && pathname === '/login') {
      hasRedirected.current = true;
      setIsLoading(false); // Stop loading before redirect
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, user, router, pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    hasRedirected.current = false; // Reset redirect flag

    try {
      await login(email, password);
      // The login function sets the user in AuthContext
      // The useEffect will handle the redirect once user state is updated
      // We don't need to manually redirect here
      // Don't set loading to false here - let the redirect happen first
      // If redirect doesn't happen, useEffect will handle it
    } catch (err: any) {
      setError(err.message || 'خطا در ورود. لطفاً دوباره تلاش کنید.');
      hasRedirected.current = false; // Reset on error
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            ورود به حساب کاربری
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            یا{' '}
            <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="ایمیل"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
            />
            <Input
              label="رمز عبور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              ورود
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

