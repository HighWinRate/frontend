'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Ticket, TicketStatus, TicketPriority, TicketType } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TicketsPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');
  const [filterType, setFilterType] = useState<TicketType | 'all'>('all');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, loading, router, filterStatus, filterPriority, filterType]);

  async function fetchTickets() {
    try {
      setLoadingTickets(true);
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;
      if (filterType !== 'all') params.type = filterType;
      
      const response = await apiClient.getTickets(params);
      setTickets(response.tickets);
    } catch (error: any) {
      // Handle 401 - redirect to login
      if (error?.status === 401) {
        router.push('/login');
        return;
      }
      
      // Handle 403 - might be role issue, show error but don't redirect
      if (error?.status === 403) {
        console.error('Access denied. You may not have permission to view tickets.');
        // Don't redirect, just show empty state
        setTickets([]);
        return;
      }
      
      // Only log other errors
      console.error('Error fetching tickets:', error);
      if (error?.status) {
        console.error('HTTP Status:', error.status);
      }
      if (error?.message) {
        console.error('Error Message:', error.message);
      }
    } finally {
      setLoadingTickets(false);
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

  const getPriorityColor = (priority: TicketPriority) => {
    const colors = {
      low: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      urgent: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    return colors[priority] || colors.medium;
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

  const getPriorityLabel = (priority: TicketPriority) => {
    const labels = {
      low: 'پایین',
      medium: 'متوسط',
      high: 'بالا',
      urgent: 'فوری',
    };
    return labels[priority] || priority;
  };

  const getTypeLabel = (type: TicketType) => {
    const labels = {
      technical: 'فنی',
      billing: 'مالی',
      general: 'عمومی',
      feature_request: 'درخواست ویژگی',
      bug_report: 'گزارش باگ',
    };
    return labels[type] || type;
  };

  if (loading || loadingTickets) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            تیکت‌های پشتیبانی
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            مدیریت و پیگیری تیکت‌های پشتیبانی
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="bg-primary-600 hover:bg-primary-700 text-white">
            تیکت جدید
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              وضعیت
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TicketStatus | 'all')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه</option>
              <option value="open">باز</option>
              <option value="in_progress">در حال بررسی</option>
              <option value="waiting_for_user">در انتظار کاربر</option>
              <option value="resolved">حل شده</option>
              <option value="closed">بسته شده</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              اولویت
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as TicketPriority | 'all')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه</option>
              <option value="low">پایین</option>
              <option value="medium">متوسط</option>
              <option value="high">بالا</option>
              <option value="urgent">فوری</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              نوع
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TicketType | 'all')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">همه</option>
              <option value="technical">فنی</option>
              <option value="billing">مالی</option>
              <option value="general">عمومی</option>
              <option value="feature_request">درخواست ویژگی</option>
              <option value="bug_report">گزارش باگ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">هیچ تیکتی یافت نشد</p>
            <Link href="/tickets/new">
              <Button variant="primary">ایجاد تیکت جدید</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
              <Link href={`/tickets/${ticket.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {ticket.subject}
                      </h3>
                      {ticket.reference_number && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          #{ticket.reference_number}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
                        {getTypeLabel(ticket.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        تاریخ ایجاد: {new Date(ticket.created_at).toLocaleDateString('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      {ticket.messages && ticket.messages.length > 0 && (
                        <span>
                          {ticket.messages.length} پیام
                        </span>
                      )}
                      {ticket.assigned_to && (
                        <span>
                          اختصاص داده شده به: {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button variant="outline" size="sm">
                      مشاهده
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

