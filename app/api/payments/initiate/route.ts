import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { productId, discountCode } = body;
  if (!productId) {
    return new NextResponse(
      JSON.stringify({ message: 'productId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from('products')
    .select('id, price')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return new NextResponse(
      JSON.stringify({ message: 'Product not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { data: activeAccounts } = await admin
    .from('bank_accounts')
    .select('id')
    .eq('is_active', true);

  if (!activeAccounts?.length) {
    return new NextResponse(
      JSON.stringify({ message: 'در حال حاضر امکان پرداخت وجود ندارد. لطفاً با پشتیبانی تماس بگیرید.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const selectedAccount = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];

  let discountResult: { final_price: number; discount_amount?: number; discount_code_id?: string } | null = null;
  if (discountCode) {
    const { data: rpcData } = await admin.rpc('validate_discount', {
      _code: discountCode.trim(),
      _product_id: productId,
      _user_id: session.user.id,
    });
    const rpcResult = rpcData as { is_valid?: boolean; final_price?: number; discount_amount?: number; discount_code_id?: string } | null;
    if (rpcResult?.is_valid) {
      discountResult = {
        final_price: rpcResult.final_price ?? product.price,
        discount_amount: rpcResult.discount_amount,
        discount_code_id: rpcResult.discount_code_id,
      };
    }
  }

  const finalPrice = discountResult?.final_price ?? product.price;
  const discountAmount = discountResult?.discount_amount ?? 0;
  const transactionRefId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const { data: transaction, error: transactionError } = await admin
    .from('transactions')
    .insert({
      user_id: session.user.id,
      product_id: productId,
      amount: finalPrice,
      discount_amount: discountAmount,
      discount_code_id: discountResult?.discount_code_id ?? null,
      ref_id: transactionRefId,
      status: 'pending',
      gateway: 'manual',
      bank_account_id: selectedAccount.id,
    })
    .select('id, ref_id')
    .single();

  if (transactionError || !transaction) {
    return new NextResponse(
      JSON.stringify({ message: transactionError?.message || 'Failed to create transaction' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return NextResponse.json({
    transactionId: transaction.id,
    refId: transaction.ref_id,
    finalPrice,
    discountAmount,
    status: 'pending',
    message: 'تراکنش ایجاد شد. به صفحه تراکنش منتقل می‌شوید.',
  });
}
