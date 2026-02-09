import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTransactionByIdForUser } from '@/lib/data/transactions-server';
import TransactionDetailClient from '@/components/TransactionDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect('/login?redirectedFrom=/transactions/' + id);
  }

  const transaction = await getTransactionByIdForUser(session.user.id, id);
  if (!transaction) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TransactionDetailClient transaction={transaction} />
    </div>
  );
}
