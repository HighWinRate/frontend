import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const content = payload?.content;
  const attachments = payload?.attachments || [];
  
  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { message: 'content is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    content: content.trim(),
    type: 'user',
    user_id: session.user.id,
    attachments: attachments,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Message recorded' });
}
