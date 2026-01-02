import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const VALID_TYPES = ['technical', 'billing', 'general', 'feature_request', 'bug_report'] as const;

type TicketPriority = (typeof VALID_PRIORITIES)[number];
type TicketType = (typeof VALID_TYPES)[number];

function generateReferenceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${timestamp.slice(-6)}-${random}`;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const subject = String(payload?.subject || '').trim();
  const description = String(payload?.description || '').trim();
  const priority = (payload?.priority || 'medium') as TicketPriority;
  const type = (payload?.type || 'general') as TicketType;

  if (!subject || !description) {
    return NextResponse.json(
      { message: 'subject and description are required' },
      { status: 400 },
    );
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json(
      { message: 'invalid priority' },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { message: 'invalid ticket type' },
      { status: 400 },
    );
  }

  const referenceNumber = generateReferenceNumber();

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      subject,
      description,
      priority,
      type,
      user_id: session.user.id,
      status: 'open',
      reference_number: referenceNumber,
    })
    .select('id, reference_number')
    .single();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { message: ticketError?.message || 'Unable to create ticket' },
      { status: 500 },
    );
  }

  const { error: messageError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticket.id,
      content: description,
      type: 'user',
      user_id: session.user.id,
    });

  if (messageError) {
    return NextResponse.json(
      { message: messageError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ticketId: ticket.id, referenceNumber: ticket.reference_number });
}
