'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || type !== 'email') {
      router.replace('/login');
      return;
    }

    supabase.auth
      .verifyOtp({
        token_hash,
        type: 'email',
      })
      .then(({ error }) => {
        if (error) {
          router.replace('/login?error=verification_failed');
        } else {
          router.replace('/dashboard');
        }
      });
  }, []);

  return <div>در حال تایید حساب...</div>;
}
