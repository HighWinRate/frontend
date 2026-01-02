'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ticket, TicketStatus } from '@/lib/api';

interface TicketDetailClientProps {
  ticket: Ticket;
  currentUserId: string;
}

const statusColors: Record<TicketStatus, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  waiting_for_user: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
};

const statusLabels: Record<TicketStatus, string> = {
  pending: 'در انتظار',
  completed: 'تکمیل شده',
  failed: 'ناموفق',
  cancelled: 'لغو شده',
  open: 'باز',
  in_progress: 'در حال بررسی',
  waiting_for_user: 'در انتظار کاربر',
  resolved: 'حل شده',
  closed: 'بسته شده',
};

export default function TicketDetailClient({ ticket, currentUserId }: TicketDetailClientProps) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    setMessageError('');
    setSendingMessage(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'user',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'خطا در ارسال پیام');
      }

      setNewMessage('');
      router.refresh();
    } catch (err: any) {
      setMessageError(err.message || 'خطا در ارسال پیام');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (ticket.status === newStatus) return;
    setStatusError('');
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'خطا در بروزرسانی وضعیت');
      }

      router.refresh();
    } catch (err: any) {
      setStatusError(err.message || 'خطا در بروزرسانی وضعیت');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const canUpdateStatus = ticket.user?.id === currentUserId;
  const ticketMessages = ticket.messages || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href="/tickets">
          <Button variant="outline" size="sm" className="mb-4">
            ← بازگشت به لیست تیکت‌ها
          </Button>
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          {ticket.subject}
        </h1>
        {ticket.reference_number && (
          <p className="text-gray-600 dark:text-gray-400 font-mono">شماره مرجع: #{ticket.reference_number}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">توضیحات تیکت</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              پیام‌ها ({ticketMessages.length})
            </h2>
            {ticketMessages.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">هنوز پیامی ثبت نشده است.</p>
            ) : (
              <div className="space-y-4">
                {ticketMessages.map((message) => {
                  const isUserMessage = message.user?.id === currentUserId;
                  const alignment = isUserMessage ? 'bg-primary-50 dark:bg-primary-900/20 border-r-4 border-primary-500' : 'bg-gray-50 dark:bg-gray-800 border-r-4 border-gray-300 dark:border-gray-600';
                  const badgeColor = message.type === 'support' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
                  return (
                    <div key={message.id} className={`p-4 rounded-lg ${alignment}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {message.user ? `${message.user.first_name} ${message.user.last_name}` : 'سیستم'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.type === 'user' ? 'کاربر' : message.type === 'support' ? 'پشتیبانی' : 'سیستم'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.created_at).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {ticket.status !== 'closed' && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">ارسال پیام جدید</h2>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="پیام خود را وارد کنید..."
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                {messageError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{messageError}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={sendingMessage} className="min-w-[120px]">
                    {sendingMessage ? 'در حال ارسال...' : 'ارسال پیام'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">اطلاعات تیکت</h3>
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">وضعیت</span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[ticket.status] || statusColors.open}`}>
                  {statusLabels[ticket.status] || ticket.status}
                </span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">اولویت</span>
                <span className="text-gray-900 dark:text-white font-medium capitalize">{ticket.priority}</span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">نوع</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {ticket.type === 'technical'
                    ? 'فنی'
                    : ticket.type === 'billing'
                    ? 'مالی'
                    : ticket.type === 'general'
                    ? 'عمومی'
                    : ticket.type === 'feature_request'
                    ? 'درخواست ویژگی'
                    : 'گزارش باگ'}
                </span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">تاریخ ایجاد</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(ticket.created_at).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {ticket.assigned_to && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">اختصاص داده شده به</span>
                  <span className="text-gray-900 dark:text-white">
                    {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                  </span>
                </div>
              )}
            </div>

            {canUpdateStatus && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">تغییر وضعیت</h4>
                {ticket.status === 'waiting_for_user' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateStatus('open')}
                    disabled={updatingStatus}
                  >
                    باز کردن مجدد
                  </Button>
                )}
                {ticket.status !== 'resolved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={updatingStatus}
                  >
                    علامت‌گذاری به عنوان حل شده
                  </Button>
                )}
                {statusError && <p className="text-xs text-red-600 dark:text-red-400">{statusError}</p>}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
