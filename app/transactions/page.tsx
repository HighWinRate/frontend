import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import TransactionsListClient from '@/components/TransactionsListClient';

export default async function TransactionsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect('/login?redirectedFrom=/transactions');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <TransactionsListClient />
    </div>
  );
}
