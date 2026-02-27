'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAccounts } from '@/lib/data/journal';
import { checkTrialLimits } from '@/lib/data/subscriptions';
import { AccountsList } from '@/components/journal/AccountsList';
import { TrialLimitBanner } from '@/components/journal/TrialLimitBanner';

export default async function JournalPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    alert(error.message);
  }

  if (!user) {
    redirect('/login?redirectedFrom=/journal');
  }

  const [accounts, limits] = await Promise.all([
    getUserAccounts(user.id),
    checkTrialLimits(user.id),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">ژورنال معاملاتی</h1>
        <p className="text-gray-400">
          مدیریت حساب‌های معاملاتی و ثبت تریدهای خود
        </p>
      </div>

      <TrialLimitBanner limits={limits} />

      <AccountsList initialAccounts={accounts} limits={limits} />
    </div>
  );
}
