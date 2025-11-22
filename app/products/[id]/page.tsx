'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Product } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<any>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await apiClient.getProduct(params.id as string);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.id]);

  useEffect(() => {
    async function checkOwnership() {
      if (!isAuthenticated || !user || !product) return;

      setCheckingOwnership(true);
      try {
        const ownedProducts = await apiClient.getOwnedProducts(user.id);
        const isOwned = ownedProducts.some(
          (p: any) => p.product?.id === product.id || p.id === product.id
        );
        setAlreadyOwned(isOwned);
      } catch (error) {
        console.error('Error checking ownership:', error);
      } finally {
        setCheckingOwnership(false);
      }
    }

    if (isAuthenticated && user && product) {
      checkOwnership();
    }
  }, [isAuthenticated, user, product]);

  const handleValidateDiscount = async () => {
    if (!discountCode || !product) return;
    setValidatingDiscount(true);
    try {
      const validation = await apiClient.validateDiscount(discountCode, product.id);
      setDiscountValidation(validation);
    } catch (error: any) {
      setDiscountValidation({
        isValid: false,
        message: error.message || 'کد تخفیف نامعتبر است',
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!product) return;

    setPurchasing(true);
    try {
      const result = await apiClient.initiateCryptoPayment({
        productId: product.id,
        cryptoCurrency: 'BTC',
        discountCode: discountValidation?.isValid ? discountCode : undefined,
      });

      alert(
        `پرداخت آغاز شد!\n\n` +
        `آدرس کیف پول: ${result.cryptoAddress}\n` +
        `مبلغ: ${result.cryptoAmount} ${result.cryptoCurrency}\n` +
        `قیمت اصلی: $${result.originalPrice}\n` +
        (result.discountAmount ? `تخفیف: $${result.discountAmount}\n` : '') +
        `قیمت نهایی: $${result.finalPrice}\n\n` +
        `لطفاً پرداخت را انجام دهید.`
      );
    } catch (error: any) {
      alert('خطا در آغاز پرداخت: ' + (error.message || 'خطای ناشناخته'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">محصول یافت نشد</p>
        </div>
      </div>
    );
  }

  const finalPrice = discountValidation?.isValid
    ? discountValidation.finalPrice
    : product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-700 mb-4">{product.description}</p>
            {product.trading_style && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">سبک معاملاتی:</span> {product.trading_style}
              </p>
            )}
            {product.trading_session && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">جلسه معاملاتی:</span> {product.trading_session}
              </p>
            )}
            {product.keywords && product.keywords.length > 0 && (
              <div className="mt-4">
                <span className="font-semibold text-sm text-gray-700">کلمات کلیدی:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {product.courses && product.courses.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">دوره‌های این محصول</h2>
              <div className="space-y-4">
                {product.courses.map((course) => (
                  <Card key={course.id}>
                    <h3 className="font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm">{course.description}</p>
                    {course.duration_minutes && (
                      <p className="text-xs text-gray-500 mt-2">
                        مدت زمان: {course.duration_minutes} دقیقه
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">قیمت:</span>
                <span className="text-2xl font-bold text-blue-600">${product.price}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">نرخ برد:</span>
                <span className="text-lg font-semibold text-green-600">
                  {product.winrate}%
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="کد تخفیف"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleValidateDiscount}
                  isLoading={validatingDiscount}
                >
                  اعمال
                </Button>
              </div>
              {discountValidation && (
                <div
                  className={`p-3 rounded ${
                    discountValidation.isValid
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {discountValidation.isValid ? (
                    <div>
                      <p className="text-sm font-semibold">تخفیف اعمال شد!</p>
                      <p className="text-xs">
                        مبلغ تخفیف: ${discountValidation.discountAmount}
                      </p>
                      <p className="text-sm font-bold mt-1">
                        قیمت نهایی: ${discountValidation.finalPrice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm">{discountValidation.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold">قیمت نهایی:</span>
                <span className="text-2xl font-bold text-blue-600">${finalPrice}</span>
              </div>
            </div>

            {alreadyOwned ? (
              <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-semibold">
                  ✓ شما این محصول را قبلاً خریداری کرده‌اید
                </p>
                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  مشاهده محصولات خریداری شده
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handlePurchase}
                isLoading={purchasing || checkingOwnership}
                disabled={checkingOwnership}
              >
                {checkingOwnership ? 'در حال بررسی...' : 'خرید با ارز دیجیتال'}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

