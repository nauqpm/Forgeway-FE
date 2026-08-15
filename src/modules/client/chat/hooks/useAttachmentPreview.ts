import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import toast from 'react-hot-toast';
import type { Attachment } from '@/modules/client/chat/types/chat.types';
import api from '@/lib/axiosIns';
import { openMediaInNewTab } from '@/shared/utils/openMediaTab';

const isOfficeFile = (filename: string, mimeType?: string) => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  if (officeExtensions.includes(ext)) return true;

  if (mimeType) {
    const officeMimes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (officeMimes.includes(mimeType)) return true;
  }
  return false;
};

const convertImageBlobToPng = async (blob: Blob): Promise<Blob> => {
  if (blob.type === 'image/png') return blob;

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Unable to prepare image for clipboard');
    context.drawImage(bitmap, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (pngBlob) => pngBlob ? resolve(pngBlob) : reject(new Error('Unable to convert image to PNG')),
        'image/png'
      );
    });
  } finally {
    bitmap.close();
  }
};

const CLIPBOARD_IMAGE_CACHE_LIMIT = 20;
// Stores Blob promises rather than object URLs, so URL.revokeObjectURL is not needed.
// Failed promises are removed below so a later copy attempt can retry the request.
const clipboardImageCache = new Map<string, Promise<Blob>>();

const prepareClipboardImage = (file: Attachment): Promise<Blob> => {
  const cachedImage = clipboardImageCache.get(file.url);
  if (cachedImage) return cachedImage;

  const preparedImage = api.get('/attachments/download-by-url', {
    params: { url: file.url },
    responseType: 'blob',
  })
    .then((response) => convertImageBlobToPng(response.data))
    .catch((error) => {
      clipboardImageCache.delete(file.url);
      throw error;
    });

  clipboardImageCache.set(file.url, preparedImage);
  if (clipboardImageCache.size > CLIPBOARD_IMAGE_CACHE_LIMIT) {
    const oldestUrl = clipboardImageCache.keys().next().value;
    if (oldestUrl) clipboardImageCache.delete(oldestUrl);
  }

  return preparedImage;
};

export function useAttachmentPreview(
  containerRef: RefObject<HTMLElement | null>,
  attachments?: Attachment[],
  isDeleted?: boolean
) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [expandedPreviews, setExpandedPreviews] = useState<Record<string, boolean>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({});
  const [isInViewport, setIsInViewport] = useState(false);
  const [copyingImageUrl, setCopyingImageUrl] = useState<string | null>(null);

  const previewUrlsRef = useRef<Record<string, string>>({});
  const loadingPreviewsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    loadingPreviewsRef.current = loadingPreviews;
  }, [loadingPreviews]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadPreview = useCallback(async (url: string) => {
    if (previewUrlsRef.current[url] || loadingPreviewsRef.current[url]) return;

    setLoadingPreviews(prev => ({ ...prev, [url]: true }));
    try {
      const response = await api.get('/attachments/download-by-url', {
        params: { url },
        responseType: 'blob',
      });
      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrls(prev => ({ ...prev, [url]: blobUrl }));
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [url]: false }));
    }
  }, []);

  useEffect(() => {
    if (isDeleted || !attachments || attachments.length === 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [attachments, isDeleted, containerRef]);

  useEffect(() => {
    if (!isInViewport || isDeleted || !attachments) return;

    attachments.forEach(file => {
      const mime = file.mimeType || '';
      const isPdf = mime === 'application/pdf';
      const isTxt = mime.startsWith('text/');
      const canPreview = isPdf || isTxt;

      if (canPreview && file.url && expandedPreviews[file.url]) {
        loadPreview(file.url);
      }
    });
  }, [isInViewport, isDeleted, attachments, expandedPreviews, loadPreview]);

  const togglePreview = async (url: string) => {
    if (loadingPreviews[url]) return;

    if (expandedPreviews[url]) {
      setExpandedPreviews(prev => ({ ...prev, [url]: false }));
      return;
    }

    setExpandedPreviews(prev => ({ ...prev, [url]: true }));
    await loadPreview(url);
  };

  const handleDownloadFile = async (file: { url: string; name?: string; mimeType?: string }) => {
    const filename = file.name || 'file';

    // Check if it's an Office document with a valid public HTTP/HTTPS URL, open in new tab via Microsoft Office Viewer
    if (file.url && isOfficeFile(filename, file.mimeType)) {
      if (file.url.startsWith('http://') || file.url.startsWith('https://')) {
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
        window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
        return;
      }
    }

    if (isDownloading) return;
    setIsDownloading(file.url);
    try {
      const response = await api.get('/attachments/download-by-url', {
        params: { url: file.url },
        responseType: 'blob',
      });
      const blob = response.data;
      const mime = file.mimeType || blob.type || '';
      const blobUrl = URL.createObjectURL(blob);

      const isPreviewable = mime === 'application/pdf' || mime.startsWith('image/') || mime.startsWith('text/');

      if (isPreviewable) {
        if (mime.startsWith('image/')) {
          openMediaInNewTab(blobUrl, filename);
        } else {
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
        }
      } else {
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Failed to download or preview file:', err);
      window.open(file.url, '_blank');
    } finally {
      setIsDownloading(null);
    }
  };

  const prepareCopyImage = useCallback((file: Attachment) => {
    void prepareClipboardImage(file).catch(() => undefined);
  }, []);

  const handleCopyImage = async (file: Attachment) => {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      toast.error('Copy image is not supported in this browser');
      return;
    }

    setCopyingImageUrl(file.url);
    try {
      const pngBlobPromise = prepareClipboardImage(file);

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlobPromise }),
      ]);
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast.error('Failed to copy image');
    } finally {
      setCopyingImageUrl(null);
    }
  };

  return {
    isDownloading,
    expandedPreviews,
    previewUrls,
    loadingPreviews,
    copyingImageUrl,
    togglePreview,
    handleDownloadFile,
    prepareCopyImage,
    handleCopyImage,
  };
}
