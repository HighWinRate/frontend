'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/utils/error';

export default function RegisterPage() {
  const supabase = createClient();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (error) throw error;

      setRegisterSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setError(
        getErrorMessage(err) || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.',
      );
      setIsLoading(false);
    }
  };

  const messageBox = (
    <>
      {error && (
        <div className="px-5 py-4 rounded-lg border-2 font-medium bg-destructive/10 border-destructive/50 text-destructive">
          {error}
        </div>
      )}
      {registerSuccess && (
        <div className="px-5 py-4 rounded-lg border-2 font-medium bg-green-500/10 border-green-500/50 text-green-600">
          ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل‌تان را تایید کنید.
        </div>
      )}
    </>
  );
  const form = !registerSuccess && (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <Input
          label="نام"
          type="text"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          required
          placeholder="نام"
        />
        <Input
          label="نام خانوادگی"
          type="text"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
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
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
          placeholder="حداقل 6 کاراکتر"
          minLength={6}
        />
      </div>
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          ثبت‌نام
        </Button>
      </div>
    </form>
  );
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10">
        <div className="space-y-3">
          <h2 className="text-center text-4xl font-bold text-foreground tracking-tight">
            ایجاد حساب کاربری
          </h2>
          <p className="text-center text-base text-muted-foreground">
            یا{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              وارد شوید
            </Link>
          </p>
        </div>
        {messageBox}
        {form}
      </div>
    </div>
  );
}
