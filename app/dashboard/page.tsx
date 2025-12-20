'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Course, Product, File as FileType, Transaction } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const hasFetchedRef = useRef<string | null>(null); // Track which user ID we've fetched for

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If not authenticated after loading is done, redirect to login
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Only fetch if we have a user ID and haven't fetched for this user yet
    if (user?.id && hasFetchedRef.current !== user.id) {
      const userId = user.id;
      hasFetchedRef.current = userId; // Mark as fetched
      let isMounted = true;
      
      async function fetchData() {
        try {
          const [coursesData, productsData, filesData, transactionsData] = await Promise.all([
            apiClient.getUserCourses(userId),
            apiClient.getOwnedProducts(userId),
            apiClient.getUserFiles(userId),
            apiClient.getMyTransactions(),
          ]);
          
          if (isMounted) {
            // Filter out any null/undefined values from products (in case backend returns null for missing products)
            const validProducts = (productsData || []).filter((p: any) => p !== null && p !== undefined);
            
            setCourses(coursesData || []);
            setProducts(validProducts);
            setFiles(filesData || []);
            setTransactions(transactionsData || []);
          }
        } catch (error) {
          console.error('[Dashboard] Error fetching data:', error);
          // Set empty arrays on error to prevent infinite loading
          if (isMounted) {
            setCourses([]);
            setProducts([]);
            setFiles([]);
            setTransactions([]);
          }
        } finally {
          if (isMounted) {
            setLoadingData(false);
          }
        }
      }
      
      setLoadingData(true);
      fetchData();
      
      return () => {
        isMounted = false;
      };
    } else if (!loading && !user) {
      hasFetchedRef.current = null; // Reset when user logs out
      setLoadingData(false);
    }
  }, [user?.id, isAuthenticated, loading, router]); // Include router in dependencies

  if (loading || loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDownloadFile = async (fileId: string) => {
    try {
      await apiClient.downloadFile(fileId);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(error.message || 'خطا در دانلود فایل');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          داشبورد کاربری
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          خوش آمدید <span className="font-semibold text-primary-600 dark:text-primary-400">{user.first_name} {user.last_name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-6 dark:text-white">محصولات خریداری شده</h2>
          {products.length === 0 ? (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">شما هنوز محصولی خریداری نکرده‌اید.</p>
              <Link href="/products">
                <Button variant="primary" className="mt-4">
                  مشاهده محصولات
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {products
                .filter((product: any) => {
                  // Filter out any products that don't have a valid product object or ID
                  const productId = product?.product?.id || product?.id;
                  return productId && (product.product || product);
                })
                .map((product) => {
                // Extract product ID - handle both direct product and UserPurchase format
                const productId = (product as any).product?.id || product.id;
                const actualProduct = (product as any).product || product;
                const purchaseDate = (product as any).purchased_at;
                
                // Validate that we have the necessary product data
                if (!actualProduct || !productId) {
                  return null;
                }
                
                // Use actualProduct for all product properties
                const productTitle = actualProduct.title || product.title || 'بدون عنوان';
                const productDescription = actualProduct.description || product.description || '';
                const productPrice = actualProduct.price || product.price || 0;
                const productWinrate = actualProduct.winrate || product.winrate || 0;
                
                return (
                  <Card key={productId || product.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                    {actualProduct.thumbnail && (
                      <div className="mb-4 h-48 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/product/${productId}/thumbnail`}
                          alt={productTitle}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <Link href={`/products/${productId}`}>
                      <h3 className="font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                        {productTitle}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{productDescription}</p>
                    
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">قیمت محصول:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">${productPrice}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">نرخ برد:</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">{productWinrate}%</span>
                      </div>
                      {actualProduct.category && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.category.name}</span>
                        </div>
                      )}
                      {actualProduct.trading_style && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">سبک معاملاتی:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.trading_style}</span>
                        </div>
                      )}
                      {actualProduct.trading_session && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">جلسه معاملاتی:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.trading_session}</span>
                        </div>
                      )}
                      {actualProduct.backtest_trades_count && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">معاملات بکتست:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.backtest_trades_count} معامله</span>
                        </div>
                      )}
                      {actualProduct.courses && actualProduct.courses.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">تعداد دوره‌ها:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.courses.length} دوره</span>
                        </div>
                      )}
                      {actualProduct.files && actualProduct.files.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">تعداد فایل‌ها:</span>
                          <span className="font-medium dark:text-gray-300">{actualProduct.files.length} فایل</span>
                        </div>
                      )}
                      {actualProduct.keywords && actualProduct.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {actualProduct.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {actualProduct.keywords.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                              +{actualProduct.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {purchaseDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">تاریخ خرید:</span>
                          <span className="font-medium dark:text-gray-300 text-xs">
                            {new Date(purchaseDate).toLocaleDateString('fa-IR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/products/${productId}`}>
                      <Button variant="outline" size="sm" className="mt-3 w-full">
                        مشاهده جزئیات کامل
                      </Button>
                    </Link>
                  </Card>
                );
              })
              .filter((item) => item !== null)}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6 dark:text-white">دوره‌های قابل دسترسی</h2>
          {courses.length === 0 ? (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">شما به هیچ دوره‌ای دسترسی ندارید.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                  {course.thumbnail && (
                    <div className="mb-4 h-48 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/course/${course.id}/thumbnail`}
                        alt={course.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.description}</p>
                  
                  <div className="space-y-2 mb-3 text-sm">
                    {course.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                        <span className="font-medium dark:text-gray-300">{course.category.name}</span>
                      </div>
                    )}
                    {course.duration_minutes && course.duration_minutes > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">مدت زمان دوره:</span>
                        <span className="font-medium dark:text-gray-300">{course.duration_minutes} دقیقه</span>
                      </div>
                    )}
                    {course.files && course.files.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">تعداد فایل‌ها:</span>
                        <span className="font-medium dark:text-gray-300">{course.files.length} فایل</span>
                      </div>
                    )}
                    {course.is_active !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                        <span className={`font-medium ${course.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {course.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    )}
                    {course.keywords && course.keywords.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {course.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {course.keywords.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                              +{course.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      مشاهده جزئیات کامل
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">فایل‌های قابل دانلود</h2>
        {files.length === 0 ? (
          <Card>
            <p className="text-gray-600 dark:text-gray-400">شما به هیچ فایلی دسترسی ندارید.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{file.name}</h3>
                <div className="space-y-2 mb-3 text-sm">
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
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => handleDownloadFile(file.id)}
                >
                  دانلود فایل
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6 dark:text-white">تراکنش‌های من</h2>
        {transactions.length === 0 ? (
          <Card>
            <p className="text-gray-600 dark:text-gray-400">شما هنوز تراکنشی ندارید.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const statusColors = {
                pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
              };

              const statusLabels = {
                pending: 'در انتظار',
                completed: 'تکمیل شده',
                failed: 'ناموفق',
                cancelled: 'لغو شده',
              };

              return (
                <Card key={transaction.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 dark:text-gray-200">
                        {transaction.product?.title || 'محصول حذف شده'}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">مبلغ:</span> ${transaction.amount}
                        </p>
                        {transaction.discount_amount && transaction.discount_amount > 0 && (
                          <p>
                            <span className="font-medium">تخفیف:</span> ${transaction.discount_amount}
                          </p>
                        )}
                        {(transaction.crypto_currency || transaction.cryptoCurrency) &&
                          (transaction.crypto_amount || transaction.cryptoAmount) && (
                            <p>
                              <span className="font-medium">مبلغ ارز دیجیتال:</span>{' '}
                              {transaction.crypto_amount || transaction.cryptoAmount}{' '}
                              {transaction.crypto_currency || transaction.cryptoCurrency}
                            </p>
                          )}
                        {(transaction.ref_id || transaction.refId) && (
                          <p>
                            <span className="font-medium">کد پیگیری:</span>{' '}
                            {transaction.ref_id || transaction.refId}
                          </p>
                        )}
                        {transaction.tx_hash && (
                          <p>
                            <span className="font-medium">هش تراکنش:</span>{' '}
                            <span className="font-mono text-xs">{transaction.tx_hash}</span>
                          </p>
                        )}
                        <p>
                          <span className="font-medium">تاریخ:</span>{' '}
                          {new Date(transaction.created_at).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[transaction.status] || statusColors.pending
                        }`}
                      >
                        {statusLabels[transaction.status] || transaction.status}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

