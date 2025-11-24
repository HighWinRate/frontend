'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiClient, Product, File as FileType } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

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
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleDownloadFile = async (fileId: string) => {
    try {
      await apiClient.downloadFile(fileId);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(error.message || 'خطا در دانلود فایل');
    }
  };

  const handleViewFileDetails = async (file: FileType) => {
    setSelectedFile(file);
    setIsFileModalOpen(true);

    // Get file URL with token in query parameter and view=true for PDF/video streaming
    // view=true tells backend to use Content-Disposition: inline instead of attachment
    const url = apiClient.getFileStreamUrl(file.id, true);

    // If it's a video file, use the URL directly for streaming
    // The backend will handle authentication from query parameter
    if (file.type === 'video' && (file.isFree || alreadyOwned)) {
      setVideoUrl(url);
    }

    // If it's a PDF file, use the URL with view=true to display in browser
    if (file.type === 'pdf' && (file.isFree || alreadyOwned)) {
      setPdfUrl(url);
    }
  };

  const handleCloseFileModal = () => {
    setIsFileModalOpen(false);
    setSelectedFile(null);
    // Clean up blob URLs if they were created
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{product.title}</h1>
          {product.thumbnail && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/product/${product.id}/thumbnail`}
                alt={product.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">توضیحات محصول</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{product.description}</p>
            
            {product.markdown_description && (
              <div className="mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">توضیحات کامل</h3>
                <div className="prose prose-sm max-w-none dark:prose-invert 
                  prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-bold
                  prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-bold
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline prose-a:hover:underline
                  prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ul:list-disc prose-ul:mr-6
                  prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-ol:list-decimal prose-ol:mr-6
                  prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-1
                  prose-code:text-gray-900 dark:prose-code:text-gray-100 
                  prose-code:bg-gray-100 dark:prose-code:bg-gray-800 
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900 
                  prose-pre:text-gray-900 dark:prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4
                  prose-pre:overflow-x-auto prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
                  prose-blockquote:border-r-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600
                  prose-blockquote:pr-4 prose-blockquote:italic prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50
                  prose-blockquote:py-2 prose-blockquote:my-4
                  prose-hr:border-gray-300 dark:prose-hr:border-gray-600 prose-hr:my-6
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                  prose-table:text-sm prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:font-semibold
                  prose-th:p-2 prose-td:p-2 prose-td:border-gray-200 dark:prose-td:border-gray-700
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {product.markdown_description}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {product.category && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">دسته‌بندی:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{product.category.name}</span>
                </div>
              )}
              {product.trading_style && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">سبک معاملاتی:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{product.trading_style}</span>
                </div>
              )}
              {product.trading_session && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">جلسه معاملاتی:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{product.trading_session}</span>
                </div>
              )}
              {product.backtest_trades_count && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">تعداد معاملات بکتست:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{product.backtest_trades_count} معامله</span>
                </div>
              )}
            </div>

            {product.backtest_results && (
              <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">نتایج بکتست:</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono overflow-x-auto">
                    {JSON.stringify(product.backtest_results, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {product.keywords && product.keywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">کلمات کلیدی:</span>
                <div className="flex flex-wrap gap-2">
                  {product.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {product.files && product.files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-gray-200">فایل‌های این محصول</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {product.files.length} فایل
                </span>
              </div>
              <div className="space-y-4">
                {product.files.map((file: FileType) => (
                  <Card key={file.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{file.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">نوع فایل:</span>
                            <span className="font-medium dark:text-gray-300 uppercase">{file.type}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">حجم فایل:</span>
                            <span className="font-medium dark:text-gray-300">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                            <span className={`font-medium ${file.isFree ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
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

          {product.courses && product.courses.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-gray-100">دوره‌های این محصول</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {product.courses.length} دوره
                </span>
              </div>
              <div className="space-y-4">
                {product.courses.map((course) => (
                  <Card key={course.id}>
                    <Link href={`/courses/${course.id}`}>
                      <h3 className="font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {course.duration_minutes && course.duration_minutes > 0 && (
                        <span>⏱️ مدت زمان: {course.duration_minutes} دقیقه</span>
                      )}
                      {course.files && course.files.length > 0 && (
                        <span>📁 {course.files.length} فایل</span>
                      )}
                    </div>
                    <Link href={`/courses/${course.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        مشاهده جزئیات دوره
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">اطلاعات محصول</h3>
              
              <div className="space-y-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">قیمت محصول:</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${product.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">نرخ برد:</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {product.winrate}%
                  </span>
                </div>
                {product.courses && product.courses.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">تعداد دوره‌ها:</span>
                    <span className="font-medium dark:text-gray-300">{product.courses.length} دوره</span>
                  </div>
                )}
                {product.files && product.files.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">تعداد فایل‌ها:</span>
                    <span className="font-medium dark:text-gray-300">{product.files.length} فایل</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">دسته‌بندی:</span>
                    <span className="font-medium dark:text-gray-300">{product.category.name}</span>
                  </div>
                )}
                {product.backtest_trades_count && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">معاملات بکتست:</span>
                    <span className="font-medium dark:text-gray-300">{product.backtest_trades_count} معامله</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">وضعیت:</span>
                  <span className={`font-medium ${product.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {product.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
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
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
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

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold dark:text-gray-300">قیمت نهایی:</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${finalPrice}</span>
              </div>
            </div>

            {alreadyOwned ? (
              <div className="w-full p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300 font-semibold">
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

      {/* File Details Modal */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={handleCloseFileModal}
        title={selectedFile?.name || 'جزئیات فایل'}
        size={selectedFile?.type === 'video' ? 'xl' : 'lg'}
      >
        {selectedFile && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">نام فایل:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedFile.name}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">نوع فایل:</span>
                <span className="text-gray-900 dark:text-gray-100 uppercase">{selectedFile.type}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">حجم فایل:</span>
                <span className="text-gray-900 dark:text-gray-100">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">وضعیت:</span>
                <span className={`font-medium ${selectedFile.isFree ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {selectedFile.isFree ? 'رایگان' : 'پولی'}
                </span>
              </div>
            </div>

            {/* Video Player */}
            {selectedFile.type === 'video' && (selectedFile.isFree || alreadyOwned) && videoUrl && (
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">پخش ویدیو</h3>
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-auto max-h-[70vh]"
                    src={videoUrl}
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      alert('خطا در پخش ویدیو. لطفا فایل را دانلود کنید.');
                    }}
                  >
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                  </video>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  اگر ویدیو پخش نشد، لطفا فایل را دانلود کنید.
                </p>
              </div>
            )}

            {/* PDF Viewer */}
            {selectedFile.type === 'pdf' && (selectedFile.isFree || alreadyOwned) && pdfUrl && (
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">مشاهده PDF</h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  <iframe
                    src={`${pdfUrl}#toolbar=1`}
                    className="w-full h-full"
                    title={selectedFile.name}
                    onError={() => {
                      alert('خطا در نمایش PDF. لطفا فایل را دانلود کنید.');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Download Button */}
            {(selectedFile.isFree || alreadyOwned) && (
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    handleDownloadFile(selectedFile.id);
                  }}
                >
                  دانلود فایل
                </Button>
              </div>
            )}

            {/* Access Denied Message */}
            {!selectedFile.isFree && !alreadyOwned && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-center">
                  برای مشاهده و دانلود این فایل، باید محصول را خریداری کنید.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

