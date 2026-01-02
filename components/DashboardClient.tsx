'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getPublicStorageUrl } from '@/lib/storage';
import {
  TransactionWithRelations,
  UserPurchaseWithProduct,
} from '@/lib/data/transactions';
import { Course } from '@/lib/api';
import { File as FileType } from '@/lib/api';
import { User } from '@/lib/api';

interface DashboardClientProps {
  user: User;
  purchases: UserPurchaseWithProduct[];
  transactions: TransactionWithRelations[];
  courses: Course[];
  files: FileType[];
}

const resolveThumbnail = (thumbnail?: string | null) =>
  getPublicStorageUrl('thumbnails', thumbnail);

export default function DashboardClient({
  user,
  purchases,
  transactions,
  courses,
  files,
}: DashboardClientProps) {
  const handleDownloadFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'خطا در دانلود فایل');
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

  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  };

  const statusLabels: Record<string, string> = {
    pending: 'در انتظار',
    completed: 'تکمیل شده',
    failed: 'ناموفق',
    cancelled: 'لغو شده',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          داشبورد کاربری
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          خوش آمدید{' '}
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {user.first_name} {user.last_name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-bold mb-6 dark:text-white">محصولات خریداری شده</h2>
          {purchases.length === 0 ? (
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
              {purchases.map((purchase) => {
                const product = purchase.product;
                if (!product) return null;
                const thumbnailUrl = resolveThumbnail(product.thumbnail);
                return (
                  <Card key={purchase.id} className="border border-gray-200 dark:border-gray-700">
                    {thumbnailUrl && (
                      <div className="mb-4 h-48 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden">
                        <img
                          src={thumbnailUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2 dark:text-white">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                      <div className="flex justify-between">
                        <span>قیمت:</span>
                        <span className="text-blue-600 dark:text-blue-300">
                          {formatPrice(product.price)} تومان
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Win Rate:</span>
                        <span className="text-green-600 dark:text-green-300">
                          {product.winrate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاریخ خرید:</span>
                        <span className="text-gray-900 dark:text-white text-xs">
                          {new Date(purchase.purchased_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" className="w-full">
                        مشاهده جزئیات
                      </Button>
                    </Link>
                  </Card>
                );
              })}
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
                <Card key={course.id} className="border border-gray-200 dark:border-gray-700">
                  <Link href={`/courses/${course.id}`}>
                    <h3 className="text-lg font-semibold dark:text-white">{course.title}</h3>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{course.description}</p>
                  <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {course.duration_minutes && (
                      <div className="flex justify-between">
                        <span>مدت زمان:</span>
                        <span>{course.duration_minutes} دقیقه</span>
                      </div>
                    )}
                    {course.files && (
                      <div className="flex justify-between">
                        <span>فایل‌ها:</span>
                        <span>{course.files.length} فایل</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="outline" className="w-full mt-3">
                      مشاهده جزئیات دوره
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-6 dark:text-white">فایل‌های قابل دانلود</h2>
          {files.length === 0 ? (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">شما به هیچ فایلی دسترسی ندارید.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{file.name}</h3>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>نوع: {file.type}</span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleDownloadFile(file.id)}>
                      دانلود
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6 dark:text-white">تراکنش‌های من</h2>
          {transactions.length === 0 ? (
            <Card>
              <p className="text-gray-600 dark:text-gray-400">شما هنوز تراکنشی نداشته‌اید.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 dark:text-white">
                        {transaction.product?.title || 'محصول حذف شده'}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>مبلغ: {transaction.amount} تومان</p>
                        {transaction.discount_amount && <p>تخفیف: {transaction.discount_amount}</p>}
                        <p>
                          تاریخ:{' '}
                          {new Date(transaction.created_at).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[transaction.status] || statusColors.pending
                      }`}
                    >
                      {statusLabels[transaction.status] || transaction.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

