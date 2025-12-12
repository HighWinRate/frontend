'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Ticket, TicketMessage, TicketStatus, MessageType } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && params.id) {
      fetchTicket();
      fetchMessages();
    }
  }, [isAuthenticated, loading, params.id, router]);

  async function fetchTicket() {
    try {
      setLoadingTicket(true);
      const data = await apiClient.getTicket(params.id as string);
      setTicket(data);
    } catch (error: any) {
      // Don't log errors for 401/403 as they will redirect automatically
      if (error?.status === 401 || error?.status === 403) {
        return;
      }
      console.error('Error fetching ticket:', error);
    } finally {
      setLoadingTicket(false);
    }
  }

  async function fetchMessages() {
    try {
      const data = await apiClient.getTicketMessages(params.id as string);
      setMessages(data);
    } catch (error: any) {
      // Don't log errors for 401/403 as they will redirect automatically
      if (error?.status === 401 || error?.status === 403) {
        return;
      }
      console.error('Error fetching messages:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    setSendingMessage(true);
    try {
      await apiClient.createTicketMessage(ticket.id, {
        content: newMessage.trim(),
        type: 'user',
      });
      setNewMessage('');
      await fetchMessages();
      await fetchTicket(); // Refresh ticket to get updated status
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'خطا در ارسال پیام');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleUpdateStatus(newStatus: TicketStatus) {
    if (!ticket) return;

    setUpdatingStatus(true);
    try {
      await apiClient.updateTicket(ticket.id, { status: newStatus });
      await fetchTicket();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'خطا در به‌روزرسانی وضعیت');
    } finally {
      setUpdatingStatus(false);
    }
  }

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      open: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      waiting_for_user: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      resolved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      closed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    };
    return colors[status] || colors.open;
  };

  const getStatusLabel = (status: TicketStatus) => {
    const labels = {
      open: 'باز',
      in_progress: 'در حال بررسی',
      waiting_for_user: 'در انتظار کاربر',
      resolved: 'حل شده',
      closed: 'بسته شده',
    };
    return labels[status] || status;
  };

  if (loading || loadingTicket) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">تیکت یافت نشد</p>
            <Link href="/tickets">
              <Button variant="outline">بازگشت به لیست تیکت‌ها</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

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
          <p className="text-gray-600 dark:text-gray-400 font-mono">
            شماره مرجع: #{ticket.reference_number}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Info */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">توضیحات تیکت</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          </Card>

          {/* Messages */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              پیام‌ها ({messages.length})
            </h2>
            <div className="space-y-4">
              {messages.map((message) => {
                const isUserMessage = message.type === 'user' && message.user?.id === user?.id;
                const isSupportMessage = message.type === 'support';
                
                return (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      isUserMessage
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-r-4 border-primary-500'
                        : isSupportMessage
                        ? 'bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-r-4 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {message.user
                            ? `${message.user.first_name} ${message.user.last_name}`
                            : 'سیستم'}
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
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Send Message */}
          {ticket.status !== 'closed' && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ارسال پیام جدید
              </h2>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را وارد کنید..."
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
                <Button
                  type="submit"
                  isLoading={sendingMessage}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  ارسال پیام
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              اطلاعات تیکت
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  وضعیت
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  اولویت
                </span>
                <span className="text-gray-900 dark:text-white font-medium capitalize">
                  {ticket.priority === 'low' ? 'پایین' : ticket.priority === 'medium' ? 'متوسط' : ticket.priority === 'high' ? 'بالا' : 'فوری'}
                </span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  نوع
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {ticket.type === 'technical' ? 'فنی' : ticket.type === 'billing' ? 'مالی' : ticket.type === 'general' ? 'عمومی' : ticket.type === 'feature_request' ? 'درخواست ویژگی' : 'گزارش باگ'}
                </span>
              </div>

              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  تاریخ ایجاد
                </span>
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
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                    اختصاص داده شده به
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                  </span>
                </div>
              )}
            </div>

            {/* Status Actions (for users) */}
            {ticket.status !== 'closed' && user && ticket.user?.id === user.id && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  تغییر وضعیت
                </h4>
                <div className="space-y-2">
                  {ticket.status === 'waiting_for_user' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpdateStatus('open')}
                      isLoading={updatingStatus}
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
                      isLoading={updatingStatus}
                    >
                      علامت‌گذاری به عنوان حل شده
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

