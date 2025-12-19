'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { register, isAuthenticated, loading, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const hasRedirected = useRef(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only redirect if user is actually authenticated (not just loading)
    if (!loading && isAuthenticated && user && !hasRedirected.current && pathname === '/register') {
      hasRedirected.current = true;
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, user, router, pathname]);

  // Handle redirect after successful registration
  useEffect(() => {
    if (registerSuccess && user && !hasRedirected.current) {
      // User profile was created, redirect to dashboard
      hasRedirected.current = true;
      router.replace('/dashboard');
    } else if (registerSuccess && !user && !hasRedirected.current) {
      // Email confirmation required - redirect to login after showing message
      setError('ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تایید کنید و سپس وارد شوید.');
      // Redirect to login after a delay
      setTimeout(() => {
        hasRedirected.current = true;
        router.replace('/login');
      }, 2000);
    }
  }, [registerSuccess, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setRegisterSuccess(false);

    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
      // Mark registration as successful
      setRegisterSuccess(true);
      // Wait a bit for user state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
      </div>
    );
  }

  // Don't render form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            ایجاد حساب کاربری
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            یا{' '}
            <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              وارد شوید
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`px-4 py-3 rounded ${
              error.includes('موفقیت') 
                ? 'bg-green-50 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="نام"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              placeholder="نام"
            />
            <Input
              label="نام خانوادگی"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              placeholder="نام خانوادگی"
            />
            <Input
              label="ایمیل"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="example@email.com"
            />
            <Input
              label="رمز عبور"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              ثبت‌نام
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

