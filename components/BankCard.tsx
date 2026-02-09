'use client';

import { useState, useCallback } from 'react';
import { formatCardNumber, formatIBAN } from '@/lib/bank-utils';

export interface BankCardProps {
  cardNumber: string;
  accountHolder: string;
  bankName: string;
  iban?: string | null;
}

export default function BankCard({
  cardNumber,
  accountHolder,
  bankName,
  iban,
}: BankCardProps) {
  const [copied, setCopied] = useState(false);
  const formattedCard = formatCardNumber(cardNumber);
  const rawCard = cardNumber.replace(/\D/g, '');
  const formattedIban = iban ? formatIBAN(iban) : null;

  const copyCardNumber = useCallback(() => {
    navigator.clipboard.writeText(rawCard).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [rawCard]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl min-h-[220px] flex flex-col justify-between text-white shadow-xl border border-white/10"
      style={{
        background: 'linear-gradient(145deg, #1a365d 0%, #0f2744 40%, #0a1c33 100%)',
        fontFamily: 'inherit',
      }}
    >
      {/* پس‌زمینه تزئینی */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.03]" />
      </div>

      <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-5">
        {/* ردیف بالا: لوگو/نام بانک */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center">
              <span className="text-amber-300 text-lg font-bold" aria-hidden>
                {bankName.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-medium text-white/90">{bankName}</span>
          </div>
        </div>

        {/* شماره کارت با دکمه کپی */}
        <div className="space-y-1">
          <p className="text-xs text-white/70">شماره کارت</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xl sm:text-2xl font-bold tracking-[0.2em] font-mono select-all"
              dir="ltr"
            >
              {formattedCard}
            </span>
            <button
              type="button"
              onClick={copyCardNumber}
              className="mr-auto px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium transition-colors"
            >
              {copied ? 'کپی شد' : 'کپی'}
            </button>
          </div>
        </div>

        {/* نام دارنده */}
        <div className="space-y-0.5">
          <p className="text-xs text-white/70">نام دارنده کارت</p>
          <p className="text-lg font-semibold tracking-wide">{accountHolder}</p>
        </div>

        {/* شبا در صورت وجود */}
        {formattedIban && (
          <div className="pt-2 border-t border-white/10 space-y-0.5">
            <p className="text-xs text-white/70">شماره شبا</p>
            <p className="text-sm font-mono tracking-tight break-all" dir="ltr">
              {formattedIban}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
