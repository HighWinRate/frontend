'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      async function fetchData() {
        try {
          const [coursesData, productsData, filesData, transactionsData] = await Promise.all([
            apiClient.getUserCourses(user.id),
            apiClient.getOwnedProducts(user.id),
            apiClient.getUserFiles(user.id),
            apiClient.getMyTransactions(),
          ]);
          setCourses(coursesData);
          setProducts(productsData);
          setFiles(filesData);
          setTransactions(transactionsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoadingData(false);
        }
      }
      fetchData();
    }
  }, [user, isAuthenticated, loading, router]);

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

  const handleDownloadFile = (fileId: string) => {
    const url = apiClient.getFileUrl(fileId);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        داشبورد کاربری
      </h1>
      <p className="text-gray-600 mb-8">
        خوش آمدید {user.first_name} {user.last_name}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">محصولات خریداری شده</h2>
          {products.length === 0 ? (
            <Card>
              <p className="text-gray-600">شما هنوز محصولی خریداری نکرده‌اید.</p>
              <Link href="/products">
                <Button variant="primary" className="mt-4">
                  مشاهده محصولات
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                // Extract product ID - handle both direct product and UserPurchase format
                const productId = (product as any).product?.id || product.id;
                const actualProduct = (product as any).product || product;
                const purchaseDate = (product as any).purchased_at;
                return (
                  <Card key={product.id}>
                    <Link href={`/products/${productId}`}>
                      <h3 className="font-semibold mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">قیمت محصول:</span>
                        <span className="text-blue-600 font-semibold">${product.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">نرخ برد:</span>
                        <span className="text-green-600 font-semibold">{product.winrate}%</span>
                      </div>
                      {actualProduct.category && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">دسته‌بندی:</span>
                          <span className="font-medium">{actualProduct.category.name}</span>
                        </div>
                      )}
                      {actualProduct.trading_style && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">سبک معاملاتی:</span>
                          <span className="font-medium">{actualProduct.trading_style}</span>
                        </div>
                      )}
                      {actualProduct.trading_session && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">جلسه معاملاتی:</span>
                          <span className="font-medium">{actualProduct.trading_session}</span>
                        </div>
                      )}
                      {actualProduct.backtest_trades_count && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">معاملات بکتست:</span>
                          <span className="font-medium">{actualProduct.backtest_trades_count} معامله</span>
                        </div>
                      )}
                      {actualProduct.courses && actualProduct.courses.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">تعداد دوره‌ها:</span>
                          <span className="font-medium">{actualProduct.courses.length} دوره</span>
                        </div>
                      )}
                      {actualProduct.files && actualProduct.files.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">تعداد فایل‌ها:</span>
                          <span className="font-medium">{actualProduct.files.length} فایل</span>
                        </div>
                      )}
                      {actualProduct.keywords && actualProduct.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {actualProduct.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {actualProduct.keywords.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{actualProduct.keywords.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {purchaseDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">تاریخ خرید:</span>
                          <span className="font-medium text-xs">
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
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">دوره‌های قابل دسترسی</h2>
          {courses.length === 0 ? (
            <Card>
              <p className="text-gray-600">شما به هیچ دوره‌ای دسترسی ندارید.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="font-semibold mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                  
                  <div className="space-y-2 mb-3 text-sm">
                    {course.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">دسته‌بندی:</span>
                        <span className="font-medium">{course.category.name}</span>
                      </div>
                    )}
                    {course.duration_minutes && course.duration_minutes > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">مدت زمان دوره:</span>
                        <span className="font-medium">{course.duration_minutes} دقیقه</span>
                      </div>
                    )}
                    {course.files && course.files.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">تعداد فایل‌ها:</span>
                        <span className="font-medium">{course.files.length} فایل</span>
                      </div>
                    )}
                    {course.is_active !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">وضعیت:</span>
                        <span className={`font-medium ${course.is_active ? 'text-green-600' : 'text-red-600'}`}>
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
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {course.keywords.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
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

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">فایل‌های قابل دانلود</h2>
        {files.length === 0 ? (
          <Card>
            <p className="text-gray-600">شما به هیچ فایلی دسترسی ندارید.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <h3 className="font-semibold mb-3">{file.name}</h3>
                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">نوع فایل:</span>
                    <span className="font-medium uppercase">{file.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">حجم فایل:</span>
                    <span className="font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">وضعیت:</span>
                    <span className={`font-medium ${file.isFree ? 'text-green-600' : 'text-blue-600'}`}>
                      {file.isFree ? 'رایگان' : 'پولی'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDownloadFile(file.id)}
                >
                  دانلود فایل
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">تراکنش‌های من</h2>
        {transactions.length === 0 ? (
          <Card>
            <p className="text-gray-600">شما هنوز تراکنشی ندارید.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                completed: 'bg-green-100 text-green-800',
                failed: 'bg-red-100 text-red-800',
                cancelled: 'bg-gray-100 text-gray-800',
              };

              const statusLabels = {
                pending: 'در انتظار',
                completed: 'تکمیل شده',
                failed: 'ناموفق',
                cancelled: 'لغو شده',
              };

              return (
                <Card key={transaction.id}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {transaction.product?.title || 'محصول حذف شده'}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
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

