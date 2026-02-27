'use client';

import { useEffect } from 'react';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <h2 className="text-3xl font-bold mb-4">یه چیزی درست کار نکرد 😕</h2>

      <p className="text-muted-foreground mb-6 max-w-md">
        یه خطای غیرمنتظره رخ داده. نگران نباش، احتمالا موقتیه. میتونی دوباره
        امتحان کنی.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition"
        >
          تلاش مجدد
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          className="px-5 py-2 rounded-xl border hover:bg-muted transition"
        >
          برگشت به خانه
        </button>
      </div>
    </div>
  );
}
