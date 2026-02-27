'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Product, File as FileType, DiscountValidation } from '@/lib/api';
import { userOwnsProduct } from '@/lib/data/transactions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/providers/AuthProvider';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({
  product,
}: ProductDetailClientProps) {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] =
    useState<DiscountValidation | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, isAuthenticated } = useAuth();

  // User check
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user ?? null);
      setLoadingUser(false);
    };
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // ownership check
  useEffect(() => {
    if (!user) {
      setAlreadyOwned(false);
      return;
    }

    let isMounted = true;
    setCheckingOwnership(true);
    userOwnsProduct(supabase, user.id, product.id)
      .then((owns) => {
        if (isMounted) setAlreadyOwned(owns);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setCheckingOwnership(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, product.id, supabase]);
  const handleValidateDiscount = useCallback(async () => {
    if (!discountCode) return;
    setValidatingDiscount(true);
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.trim(),
          productId: product.id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'اعتبارسنجی کد تخفیف ناموفق بود');
      }

      const data: DiscountValidation = await response.json();
      setDiscountValidation(data);
    } catch (error: any) {
      setDiscountValidation({
        isValid: false,
        discountAmount: 0,
        finalPrice: product.price,
        message: error.message || 'کد تخفیف نامعتبر است',
      });
    } finally {
      setValidatingDiscount(false);
    }
  }, [discountCode, product.id, product.price]);

  const handlePurchase = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          discountCode:
            discountValidation && discountValidation.isValid
              ? discountCode.trim()
              : undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'خطای ثبت تراکنش');
      }

      router.push(`/transactions/${payload.transactionId}`);
    } catch (error: any) {
      alert(error.message || 'خطا در آغاز پرداخت');
    } finally {
      setPurchasing(false);
    }
  }, [discountCode, discountValidation, isAuthenticated, product.id, router]);

  const handleDownloadFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'خطایی در دانلود فایل رخ داد');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `file-${fileId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      alert(error.message || 'خطا در دانلود فایل');
    }
  }, []);

  const handleViewFileDetails = useCallback(
    async (file: FileType) => {
      setSelectedFile(file);
      setIsFileModalOpen(true);
      const viewerUrl = `/api/files/${file.id}?view=true`;

      if (file.type === 'video' && (file.isFree || alreadyOwned)) {
        setVideoUrl(viewerUrl);
      }

      if (file.type === 'pdf' && (file.isFree || alreadyOwned)) {
        setPdfUrl(viewerUrl);
      }
    },
    [alreadyOwned],
  );

  const handleCloseFileModal = useCallback(() => {
    setIsFileModalOpen(false);
    setSelectedFile(null);
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
    }
    setVideoUrl(null);
    setPdfUrl(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
  }, [pdfUrl, videoUrl]);

  if (!product) {
    return null;
  }

  const finalPrice = discountValidation?.isValid
    ? discountValidation.finalPrice
    : product.price;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fa-IR').format(price);

  if (loadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product summary and details */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {product.title}
            </h1>
            <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>{product.description}</p>
              {product.markdown_description && (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {product.markdown_description}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {product.files && product.files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">
                  فایل‌های محصول
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {product.files.length} فایل
                </span>
              </div>
              <div className="space-y-4">
                {product.files.map((file) => (
                  <Card key={file.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-3 dark:text-white">
                          {file.name}
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              نوع فایل:
                            </span>
                            <span className="font-medium dark:text-gray-300 uppercase">
                              {file.type}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              حجم فایل:
                            </span>
                            <span className="font-medium dark:text-gray-300">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              وضعیت:
                            </span>
                            <span
                              className={`font-medium ${
                                file.isFree
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {file.isFree ? 'رایگان' : 'پولی'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFileDetails(file)}
                        >
                          جزئیات
                        </Button>
                        {(file.isFree || alreadyOwned) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(file.id)}
                          >
                            دانلود
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                اطلاعات محصول
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {product.category ? product.category.name : 'بدون دسته‌بندی'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  قیمت اصلی
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(product.price)} تومان
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  نهایی
                </span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(finalPrice)} تومان
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  نرخ برد
                </span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {product.winrate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="کد تخفیف"
                  value={discountCode}
                  onChange={(event) => setDiscountCode(event.target.value)}
                />
                <Button
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
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  {discountValidation.isValid ? (
                    <>
                      <p className="text-sm font-semibold">تخفیف اعمال شد!</p>
                      <p className="text-xs">
                        مبلغ تخفیف: {discountValidation.discountAmount}
                      </p>
                      <p className="text-sm font-bold mt-1">
                        قیمت نهایی: {discountValidation.finalPrice}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm">{discountValidation.message}</p>
                  )}
                </div>
              )}
            </div>
            {!isAuthenticated ? (
              <Button className="w-full" onClick={() => router.push('/login')}>
                ورود
              </Button>
            ) : alreadyOwned ? (
              <Button
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                مشاهده داشبورد
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handlePurchase}
                isLoading={purchasing || checkingOwnership}
                disabled={checkingOwnership}
              >
                {checkingOwnership
                  ? 'در حال بررسی...'
                  : purchasing
                    ? 'در حال ثبت...'
                    : 'خرید (پرداخت کارت به کارت)'}
              </Button>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isFileModalOpen}
        onClose={handleCloseFileModal}
        title={selectedFile?.name || 'جزئیات فایل'}
        size={selectedFile?.type === 'video' ? 'xl' : 'lg'}
      >
        {selectedFile && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  نام فایل
                </span>
                <span className="text-gray-900 dark:text-white">
                  {selectedFile.name}
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  نوع فایل
                </span>
                <span className="text-gray-900 dark:text-white uppercase">
                  {selectedFile.type}
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  حجم
                </span>
                <span className="text-gray-900 dark:text-white">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  وضعیت
                </span>
                <span
                  className={`text-sm font-semibold ${
                    selectedFile.isFree
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {selectedFile.isFree ? 'رایگان' : 'پولی'}
                </span>
              </div>
            </div>

            {selectedFile.type === 'video' &&
              (selectedFile.isFree || alreadyOwned) &&
              videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    پخش ویدیو
                  </h3>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full h-auto max-h-[70vh]"
                      src={videoUrl}
                      onError={(event) => {
                        console.error('Video playback error:', event);
                        alert('خطا در پخش ویدیو');
                      }}
                    />
                  </div>
                </div>
              )}

            {selectedFile.type === 'pdf' &&
              (selectedFile.isFree || alreadyOwned) &&
              pdfUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                    پیش‌نمایش PDF
                  </h3>
                  <div
                    className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
                    style={{ height: '600px' }}
                  >
                    <iframe
                      src={`${pdfUrl}#toolbar=1`}
                      className="w-full h-full"
                      title={selectedFile.name}
                      onError={() => alert('خطا در نمایش PDF')}
                    />
                  </div>
                </div>
              )}

            {(selectedFile.isFree || alreadyOwned) && (
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={() => handleDownloadFile(selectedFile.id)}>
                  دانلود فایل
                </Button>
              </div>
            )}

            {!selectedFile.isFree && !alreadyOwned && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-center">
                  برای دسترسی به این فایل باید محصول را خریداری کنید.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
