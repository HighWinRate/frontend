'use server';

import { redirect } from 'next/navigation';
import TicketsClient from '@/components/TicketsClient';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserTickets } from '@/lib/data/tickets';

export default async function TicketsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect('/login?redirectedFrom=/tickets');
  }

  const tickets = await getUserTickets(supabase, session.user.id);

  return <TicketsClient tickets={tickets} />;
}
