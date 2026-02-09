'use client';

import Link from 'next/link';
import BankCard from '@/components/BankCard';

interface BankAccountData {
  id: string;
  card_number: string;
  account_holder: string;
  bank_name: string;
  iban?: string | null;
}

interface TransactionDetailData {
  id: string;
  ref_id: string;
  amount: number;
  discount_amount?: number | null;
  status: string;
  created_at: string;
  product?: { id: string; title: string; price: number } | null;
  bank_account?: BankAccountData | null;
}

interface TransactionDetailClientProps {
  transaction: TransactionDetailData;
}

export default function TransactionDetailClient({
  transaction,
}: TransactionDetailClientProps) {
  const statusLabel: Record<string, string> = {
    pending: 'در انتظار پرداخت',
    completed: 'تکمیل شده',
    failed: 'ناموفق',
    cancelled: 'لغو شده',
  };

  const isPending = transaction.status === 'pending';
  const finalAmount = transaction.amount;
  const formatAmount = (n: number) =>
    new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">جزئیات تراکنش</h1>
        <p className="text-muted-foreground">
          شماره پیگیری: <span className="font-mono text-foreground">{transaction.ref_id}</span>
        </p>
      </div>

      {/* Bank card */}
      {transaction.bank_account && isPending && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">مبلغ را به کارت زیر واریز کنید</h2>
          <BankCard
            cardNumber={transaction.bank_account.card_number}
            accountHolder={transaction.bank_account.account_holder}
            bankName={transaction.bank_account.bank_name}
            iban={transaction.bank_account.iban}
          />
        </div>
      )}

      {/* Transaction info */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold mb-3 text-foreground">اطلاعات تراکنش</h2>
        <div className="flex justify-between">
          <span className="text-muted-foreground">محصول</span>
          <span className="text-foreground">{transaction.product?.title ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">مبلغ نهایی</span>
          <span className="font-semibold text-foreground">{formatAmount(finalAmount)}</span>
        </div>
        {transaction.discount_amount ? (
          <div className="flex justify-between text-muted-foreground text-sm">
            <span>تخفیف</span>
            <span>{formatAmount(transaction.discount_amount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted-foreground">وضعیت</span>
          <span
            className={
              transaction.status === 'completed'
                ? 'text-green-400 font-medium'
                : transaction.status === 'pending'
                  ? 'text-amber-400 font-medium'
                  : 'text-muted-foreground'
            }
          >
            {statusLabel[transaction.status] ?? transaction.status}
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>تاریخ</span>
          <span>{new Date(transaction.created_at).toLocaleDateString('fa-IR')}</span>
        </div>
      </div>

      {/* Instructions for pending */}
      {isPending && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-amber-400">راهنمای پرداخت</h2>
          <ol className="list-decimal list-inside space-y-2 text-amber-200/90">
            <li>مبلغ {formatAmount(finalAmount)} را به شماره کارت بالا واریز کنید.</li>
            <li>از اپ یا منوی بانک خود رسید تراکنش را ذخیره یا عکس بگیرید.</li>
            <li>یک تیکت پشتیبانی ایجاد کنید و رسید را در تیکت ارسال کنید.</li>
            <li>پس از بررسی، دسترسی به محصول برای شما فعال می‌شود.</li>
          </ol>
          <div className="pt-2">
            <Link
              href={`/tickets/new?transaction=${transaction.id}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[280px] rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold text-lg px-8 py-4 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 hover:ring-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              ایجاد تیکت و ارسال رسید
            </Link>
          </div>
        </div>
      )}

      {/* Completed */}
      {transaction.status === 'completed' && transaction.product && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
          <p className="text-green-400 font-medium mb-3">پرداخت شما با موفقیت ثبت شد.</p>
          <Link
            href={`/products/${transaction.product.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:opacity-90"
          >
            مشاهده محصول
          </Link>
        </div>
      )}

      <div>
        <Link href="/transactions" className="text-primary hover:underline text-sm">
          بازگشت به لیست تراکنش‌ها
        </Link>
      </div>
    </div>
  );
}
