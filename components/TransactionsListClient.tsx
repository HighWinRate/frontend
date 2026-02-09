'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TransactionItem {
  id: string;
  ref_id: string;
  amount: number;
  discount_amount?: number;
  status: string;
  created_at: string;
  product?: { id: string; title: string } | null;
}

export default function TransactionsListClient() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/transactions', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = statusFilter
    ? transactions.filter((t) => t.status === statusFilter)
    : transactions;

  const statusLabel: Record<string, string> = {
    pending: 'در انتظار پرداخت',
    completed: 'تکمیل شده',
    failed: 'ناموفق',
    cancelled: 'لغو شده',
  };

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  const statusClass: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
    cancelled: 'bg-muted text-muted-foreground border border-border',
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        در حال بارگذاری تراکنش‌ها...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h2 className="text-xl font-bold text-foreground">تراکنش‌های من</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-input bg-background text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="completed">تکمیل شده</option>
          <option value="failed">ناموفق</option>
          <option value="cancelled">لغو شده</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          تراکنشی یافت نشد.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  شماره تراکنش
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  محصول
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  مبلغ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  وضعیت
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  تاریخ
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">
                    {t.ref_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {t.product?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {formatAmount(t.amount)}
                    {t.discount_amount ? (
                      <span className="text-muted-foreground text-xs mr-1">
                        (تخفیف: {formatAmount(t.discount_amount)})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                        statusClass[t.status] ?? 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {statusLabel[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/transactions/${t.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      مشاهده
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        پس از واریز مبلغ، از طریق{' '}
        <Link href="/tickets/new" className="text-primary hover:underline">
          ایجاد تیکت
        </Link>{' '}
        رسید پرداخت را ارسال کنید.
      </p>
    </div>
  );
}
