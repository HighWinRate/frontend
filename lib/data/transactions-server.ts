import { createAdminClient } from '@/lib/supabase/admin';

export interface TransactionDetailRow {
  id: string;
  ref_id: string;
  user_id: string;
  product_id: string | null;
  amount: number;
  discount_amount: number | null;
  status: string;
  created_at: string;
  product?: { id: string; title: string; price: number } | null;
  bank_account?: {
    id: string;
    card_number: string;
    account_holder: string;
    bank_name: string;
    iban: string | null;
  } | null;
}

export async function getTransactionByIdForUser(
  userId: string,
  transactionId: string
): Promise<TransactionDetailRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transactions')
    .select(
      `
      id,
      ref_id,
      user_id,
      product_id,
      amount,
      discount_amount,
      status,
      created_at,
      product:products(id, title, price),
      bank_account:bank_accounts(id, card_number, account_holder, bank_name, iban)
    `
    )
    .eq('id', transactionId)
    .single();

  if (error || !data) return null;
  if (data.user_id !== userId) return null;

  return data as unknown as TransactionDetailRow;
}
