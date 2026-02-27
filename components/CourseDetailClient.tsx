'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Course, File as FileType } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { userHasCourseAccess } from '@/lib/data/courses';
import { getPublicStorageUrl } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/providers/AuthProvider';
interface CourseDetailClientProps {
  course: Course;
}

export default function CourseDetailClient({
  course,
}: CourseDetailClientProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resolveThumbnail = (path?: string | null) =>
    getPublicStorageUrl('thumbnails', path);
  const courseThumbnailUrl = resolveThumbnail(course.thumbnail);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || !user) {
      setHasAccess(false);
      return;
    }

    setCheckingAccess(true);
    userHasCourseAccess(supabase, user.id, course.id)
      .then((access) => {
        if (isMounted) {
          setHasAccess(access);
        }
      })
      .catch((error) => {
        console.error('[CourseDetail] access check failed', error);
      })
      .finally(() => {
        if (isMounted) {
          setCheckingAccess(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [course.id, isAuthenticated, supabase, user]);

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

  const handleViewFileDetails = useCallback(
    (file: FileType) => {
      setSelectedFile(file);
      setIsFileModalOpen(true);
      const viewerUrl = `/api/files/${file.id}?view=true`;

      if (file.type === 'video' && (file.isFree || hasAccess)) {
        setVideoUrl(viewerUrl);
      }
      if (file.type === 'pdf' && (file.isFree || hasAccess)) {
        setPdfUrl(viewerUrl);
      }
    },
    [hasAccess],
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <header>
          <h1 className="text-4xl font-bold dark:text-white mb-2">
            {course.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {course.description}
          </p>
        </header>

        {courseThumbnailUrl && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6">
            <img
              src={courseThumbnailUrl}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {course.markdown_description && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {course.markdown_description}
            </ReactMarkdown>
          </div>
        )}

        {course.markdown_content && (
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">
              محتوای دوره
            </h2>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {course.markdown_content}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {course.files && course.files.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-white">
                فایل‌های دوره
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                {course.files.length} فایل
              </span>
            </div>
            <div className="space-y-4">
              {course.files.map((file) => (
                <Card key={file.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold dark:text-white">
                        {file.name}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        حجم: {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {file.isFree ? 'رایگان' : 'پولی'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewFileDetails(file)}
                      >
                        جزئیات
                      </Button>
                      {(file.isFree || hasAccess) && (
                        <Button
                          size="sm"
                          variant="outline"
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
          </section>
        )}

        <Card className="space-y-3">
          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                وضعیت دسترسی:{' '}
                {checkingAccess
                  ? 'در حال بررسی...'
                  : hasAccess
                    ? 'دسترسی برقرار است'
                    : 'دسترسی ندارد'}
              </p>
              {!hasAccess && (
                <Button
                  className="w-full"
                  onClick={() => router.push('/products')}
                >
                  مشاهده محصولات برای خرید
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                برای مشاهده فایل‌ها باید وارد شوید.
              </p>
              <Button className="w-full" onClick={() => router.push('/login')}>
                ورود
              </Button>
            </div>
          )}
        </Card>
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
                  className={`font-semibold ${
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
              (selectedFile.isFree || hasAccess) &&
              videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-white">
                    پخش ویدیو
                  </h3>
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-auto max-h-[70vh] bg-black rounded-lg"
                    src={videoUrl}
                    onError={(event) => {
                      console.error('Video playback error:', event);
                      alert('خطا در پخش ویدیو');
                    }}
                  />
                </div>
              )}

            {selectedFile.type === 'pdf' &&
              (selectedFile.isFree || hasAccess) &&
              pdfUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-white">
                    پیش‌نمایش PDF
                  </h3>
                  <div className="h-[600px] bg-gray-100 dark:bg-gray-900 overflow-hidden rounded-lg">
                    <iframe
                      src={`${pdfUrl}#toolbar=1`}
                      title={selectedFile.name}
                      className="w-full h-full"
                      onError={() => alert('خطا در نمایش PDF')}
                    />
                  </div>
                </div>
              )}

            {(selectedFile.isFree || hasAccess) && (
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={() => handleDownloadFile(selectedFile.id)}>
                  دانلود فایل
                </Button>
              </div>
            )}

            {!selectedFile.isFree && !hasAccess && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-center">
                  برای دانلود این فایل باید به دوره دسترسی داشته باشید.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
