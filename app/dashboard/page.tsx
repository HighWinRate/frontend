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
              {products.map((product) => (
                <Card key={product.id}>
                  <h3 className="font-semibold mb-2">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-semibold">${product.price}</span>
                    <span className="text-green-600">نرخ برد: {product.winrate}%</span>
                  </div>
                </Card>
              ))}
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
                <h3 className="font-semibold mb-2">{file.name}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  نوع: {file.type} | حجم: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile(file.id)}
                >
                  دانلود
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

