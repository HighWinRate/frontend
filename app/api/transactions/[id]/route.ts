import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: transactionId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const admin = createAdminClient();
  const { data: transaction, error } = await admin
    .from('transactions')
    .select(
      `
      *,
      product:products(id, title, price),
      bank_account:bank_accounts(id, card_number, account_holder, bank_name, iban)
    `
    )
    .eq('id', transactionId)
    .single();

  if (error || !transaction) {
    return new NextResponse(
      JSON.stringify({ message: 'Transaction not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (transaction.user_id !== session.user.id) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return NextResponse.json(transaction);
}
