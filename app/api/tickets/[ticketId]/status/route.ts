import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TicketStatus } from '@/lib/api';

const VALID_STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'waiting_for_user',
  'resolved',
  'closed',
];

export async function PATCH(request: Request, { params }: { params: { ticketId: string } }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { status } = await request.json().catch(() => ({}));
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ message: 'Invalid or missing status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', params.ticketId)
    .select('id');

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Status updated' });
}
