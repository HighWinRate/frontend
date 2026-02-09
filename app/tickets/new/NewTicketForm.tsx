'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TicketPriority, TicketType } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload, UploadedImage } from '@/components/ImageUpload';

export default function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction');
  const { isAuthenticated, loading } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [type, setType] = useState<TicketType>('general');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [relatedTransactionId, setRelatedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId || !isAuthenticated || relatedTransactionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/transactions/${transactionId}`, { credentials: 'include' });
        if (!res.ok || cancelled) return;
        const tx = await res.json();
        if (cancelled) return;
        setSubject(`ارسال رسید پرداخت - تراکنش #${tx.ref_id || transactionId}`);
        setType('billing');
        setDescription(
          `شماره تراکنش: ${tx.ref_id || transactionId}\n\nلطفاً تصویر رسید واریز را در پیوست ارسال کنید.`
        );
        setRelatedTransactionId(transactionId);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transactionId, isAuthenticated, relatedTransactionId]);

  if (!loading && !isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !description.trim()) {
      setError('لطفاً موضوع و توضیحات را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          priority,
          type,
          attachments: images,
          relatedTransactionId: relatedTransactionId || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'خطا در ایجاد تیکت');
      }

      const data = await response.json();
      const ticketId = data.ticketId || data.id;
      router.push(ticketId ? `/tickets/${ticketId}` : '/tickets');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد تیکت');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          ایجاد تیکت جدید
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          تیکت جدید برای پشتیبانی ایجاد کنید
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              موضوع <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع تیکت را وارد کنید"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              توضیحات <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات کامل مشکل یا درخواست خود را وارد کنید"
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اولویت
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">پایین</option>
                <option value="medium">متوسط</option>
                <option value="high">بالا</option>
                <option value="urgent">فوری</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع تیکت
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="general">عمومی</option>
                <option value="technical">فنی</option>
                <option value="billing">مالی</option>
                <option value="feature_request">درخواست ویژگی</option>
                <option value="bug_report">گزارش باگ</option>
              </select>
            </div>
          </div>

          <ImageUpload
            onImagesChange={setImages}
            maxImages={5}
            disabled={submitting}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>در حال ایجاد...</span>
                </>
              ) : (
                <span>ایجاد تیکت</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-lg transition-all duration-200 min-w-[140px]"
            >
              انصراف
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
