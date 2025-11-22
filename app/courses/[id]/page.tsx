'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Course, File as FileType } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await apiClient.getCourse(params.id as string);
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [params.id]);

  useEffect(() => {
    async function checkAccess() {
      if (!isAuthenticated || !user || !course) return;

      setCheckingAccess(true);
      try {
        const userCourses = await apiClient.getUserCourses(user.id);
        const hasCourseAccess = userCourses.some((c) => c.id === course.id);
        setHasAccess(hasCourseAccess);
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setCheckingAccess(false);
      }
    }

    if (isAuthenticated && user && course) {
      checkAccess();
    }
  }, [isAuthenticated, user, course]);

  const handleDownloadFile = (fileId: string) => {
    const url = apiClient.getFileUrl(fileId);
    window.open(url, '_blank');
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

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-red-600">دوره یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">توضیحات دوره</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">{course.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
              {course.duration_minutes !== undefined && course.duration_minutes !== null && course.duration_minutes > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 block mb-1">مدت زمان دوره:</span>
                  <span className="text-gray-800 font-medium">{course.duration_minutes} دقیقه</span>
                </div>
              )}
              {course.files && course.files.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 block mb-1">تعداد فایل‌ها:</span>
                  <span className="text-gray-800 font-medium">{course.files.length} فایل</span>
                </div>
              )}
            </div>

            {course.keywords && course.keywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700 block mb-2">کلمات کلیدی:</span>
                <div className="flex flex-wrap gap-2">
                  {course.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {course.markdown_content && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">محتوای دوره</h2>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                  {course.markdown_content}
                </pre>
              </div>
            </div>
          )}

          {course.files && course.files.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">فایل‌های دوره</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {course.files.length} فایل
                </span>
              </div>
              <div className="space-y-4">
                {course.files.map((file: FileType) => (
                  <Card key={file.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-3 text-gray-800">{file.name}</h3>
                        <div className="space-y-1 text-sm">
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
                      </div>
                      {hasAccess && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                          onClick={() => handleDownloadFile(file.id)}
                        >
                          دانلود
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">اطلاعات دوره</h3>
              
              <div className="space-y-4 mb-4 pb-4 border-b border-gray-200">
                {course.duration_minutes !== undefined && course.duration_minutes !== null && course.duration_minutes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">مدت زمان دوره:</span>
                    <span className="font-semibold">{course.duration_minutes} دقیقه</span>
                  </div>
                )}

                {course.files && course.files.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">تعداد فایل‌ها:</span>
                    <span className="font-semibold">{course.files.length} فایل</span>
                  </div>
                )}

                {course.keywords && course.keywords.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">تعداد کلمات کلیدی:</span>
                    <span className="font-semibold">{course.keywords.length} کلمه</span>
                  </div>
                )}
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-700 font-semibold mb-3">
                  برای دسترسی به این دوره باید وارد شوید
                </p>
                <Button
                  className="w-full"
                  onClick={() => router.push('/login')}
                >
                  ورود به حساب کاربری
                </Button>
              </div>
            ) : !hasAccess ? (
              <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-700 font-semibold mb-3">
                  شما به این دوره دسترسی ندارید
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push('/products')}
                >
                  مشاهده محصولات
                </Button>
              </div>
            ) : (
              <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-semibold mb-3">
                  ✓ شما به این دوره دسترسی دارید
                </p>
                <Button
                  className="w-full mt-3"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  بازگشت به داشبورد
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

