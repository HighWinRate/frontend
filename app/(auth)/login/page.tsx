'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      console.log(data.user, data.session, loginError);

      if (loginError) {
        if (loginError?.code === 'email_not_confirmed') {
          router.replace('/verify-email');
          return;
        }

        // other auth errors
        console.error(loginError?.message);
      } else {
        // everything ok
        router.replace('/dashboard');
      }
    } catch (err) {
      setError(err?.message || 'خطا در ورود. دوباره تلاش کنید.');
    } finally {
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
            حساب ندارید؟{' '}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 underline"
            >
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
              dir="ltr"
              lang="en"
              className="text-left"
              placeholder="example@email.com"
            />
            <Input
              label="رمز عبور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              lang="en"
              className="text-left show-password-input"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full border-solid border-3 border-primary rounded-md"
              size="lg"
              isLoading={isLoading}
            >
              ورود
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
