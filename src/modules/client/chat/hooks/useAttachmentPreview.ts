import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import type { Attachment } from '@/modules/client/chat/types/chat.types';
import api from '@/lib/axiosIns';

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
    if (isDownloading) return;
    const filename = file.name || 'file';
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
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5 * 60 * 1000);
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

  return {
    isDownloading,
    expandedPreviews,
    previewUrls,
    loadingPreviews,
    togglePreview,
    handleDownloadFile,
  };
}
