'use client';

import { useEffect } from 'react';
import { LANDING_URLS } from '@/lib/constants';

export default function Home() {
  useEffect(() => {
    // Redirect to Landing Page
    window.location.href = LANDING_URLS.home;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          در حال انتقال به صفحه اصلی...
        </p>
      </div>
    </div>
  );
}
