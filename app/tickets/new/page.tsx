'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, TicketPriority, TicketType } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewTicketPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [type, setType] = useState<TicketType>('general');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      const ticket = await apiClient.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        type,
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد تیکت');
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

          <div className="flex gap-4">
            <Button
              type="submit"
              isLoading={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              ایجاد تیکت
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              انصراف
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

