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
    // Don't redirect while auth is still loading
    if (loading) {
      return;
    }

    // Redirect if authenticated and on login page
    if (isAuthenticated && user && pathname === '/login' && !hasRedirected.current) {
      hasRedirected.current = true;
      setIsLoading(false);
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, user, router, pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    hasRedirected.current = false;

    try {
      await login(email, password);
      hasRedirected.current = true;
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'خطا در ورود. لطفاً دوباره تلاش کنید.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10">
        <div className="space-y-3">
          <h2 className="text-center text-4xl font-bold text-foreground tracking-tight">
            ورود به حساب کاربری
          </h2>
          <p className="text-center text-base text-muted-foreground">
            یا{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
              ثبت‌نام کنید
            </Link>
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border-2 border-destructive/50 text-destructive px-5 py-4 rounded-lg font-medium">
              {error}
            </div>
          )}
          <div className="space-y-5">
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

          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              ورود
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

