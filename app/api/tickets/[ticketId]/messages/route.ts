import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { ticketId: string } }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const { content } = await request.json().catch(() => ({}));
  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { message: 'content is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: params.ticketId,
    content: content.trim(),
    type: 'user',
    user_id: session.user.id,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Message recorded' });
}
