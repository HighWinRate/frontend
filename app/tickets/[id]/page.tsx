'use server';

import { notFound, redirect } from 'next/navigation';
import TicketDetailClient from '@/components/TicketDetailClient';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTicketWithRelations } from '@/lib/data/tickets';

interface Params {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: Params) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    redirect(`/login?redirectedFrom=/tickets/${params.id}`);
  }

  const ticket = await getTicketWithRelations(supabase, params.id);

  if (!ticket) {
    notFound();
  }

  return <TicketDetailClient ticket={ticket} currentUserId={session.user.id} />;
}
