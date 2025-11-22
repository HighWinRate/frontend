'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Course, File as FileType } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

    // Get file URL with token in query parameter for video streaming
    const url = apiClient.getFileStreamUrl(file.id);

    // If it's a video file, use the URL directly for streaming
    // The backend will handle authentication from query parameter
    if (file.type === 'video' && (file.isFree || hasAccess)) {
      setVideoUrl(url);
    }

    // If it's a PDF file, use the URL directly (with token in query parameter if needed)
    if (file.type === 'pdf' && (file.isFree || hasAccess)) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{course.title}</h1>
          
          {course.thumbnail && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">توضیحات دوره</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{course.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {course.category && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">دسته‌بندی:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{course.category.name}</span>
                </div>
              )}
              {course.duration_minutes !== undefined && course.duration_minutes !== null && course.duration_minutes > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">مدت زمان دوره:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{course.duration_minutes} دقیقه</span>
                </div>
              )}
              {course.files && course.files.length > 0 && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">تعداد فایل‌ها:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{course.files.length} فایل</span>
                </div>
              )}
              {course.is_active !== undefined && (
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">وضعیت:</span>
                  <span className={`text-gray-800 dark:text-gray-200 font-medium ${course.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {course.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              )}
            </div>

            {course.keywords && course.keywords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">کلمات کلیدی:</span>
                <div className="flex flex-wrap gap-2">
                  {course.keywords.map((keyword, idx) => (
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

          {course.markdown_content && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">محتوای دوره</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {course.markdown_content}
                </pre>
              </div>
            </div>
          )}

          {course.files && course.files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-gray-200">فایل‌های دوره</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {course.files.length} فایل
                </span>
              </div>
              <div className="space-y-4">
                {course.files.map((file: FileType) => (
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
                        {(file.isFree || hasAccess) && (
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

        <div className="lg:col-span-1">
          <Card>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">اطلاعات دوره</h3>
              
              <div className="space-y-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {course.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">دسته‌بندی:</span>
                    <span className="font-semibold dark:text-gray-300">{course.category.name}</span>
                  </div>
                )}
                {course.duration_minutes !== undefined && course.duration_minutes !== null && course.duration_minutes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">مدت زمان دوره:</span>
                    <span className="font-semibold dark:text-gray-300">{course.duration_minutes} دقیقه</span>
                  </div>
                )}

                {course.files && course.files.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">تعداد فایل‌ها:</span>
                    <span className="font-semibold dark:text-gray-300">{course.files.length} فایل</span>
                  </div>
                )}

                {course.keywords && course.keywords.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">تعداد کلمات کلیدی:</span>
                    <span className="font-semibold dark:text-gray-300">{course.keywords.length} کلمه</span>
                  </div>
                )}

                {course.is_active !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">وضعیت:</span>
                    <span className={`font-semibold ${course.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {course.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <p className="text-yellow-700 dark:text-yellow-300 font-semibold mb-3">
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
              <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                <p className="text-yellow-700 dark:text-yellow-300 font-semibold mb-3">
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
              <div className="w-full p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300 font-semibold mb-3">
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
            {selectedFile.type === 'video' && (selectedFile.isFree || hasAccess) && (
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">پخش ویدیو</h3>
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-auto max-h-[70vh]"
                    src={videoUrl || undefined}
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
            {selectedFile.type === 'pdf' && (selectedFile.isFree || hasAccess) && pdfUrl && (
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
            {(selectedFile.isFree || hasAccess) && (
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
            {!selectedFile.isFree && !hasAccess && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-center">
                  برای مشاهده و دانلود این فایل، باید دوره مربوطه را خریداری کنید.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

