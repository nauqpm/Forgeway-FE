'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Download, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEscapeStack } from '@/shared/hooks/useEscapeStack';

export interface LightboxFile {
  url: string;
  name: string;
  mimeType?: string;
}

interface MediaLightboxProps {
  file: LightboxFile | null;
  isDownloading?: boolean;
  onDownload: (file: LightboxFile) => void;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const INITIAL_VIEW = { scale: 1, x: 0, y: 0 };

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export default function MediaLightbox({
  file,
  isDownloading = false,
  onDownload,
  onClose,
}: MediaLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState(INITIAL_VIEW);
  const [isDragging, setIsDragging] = useState(false);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewRef = useRef(INITIAL_VIEW);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, imageX: 0, imageY: 0 });
  const isVideo = file?.mimeType?.toLowerCase().startsWith('video/') ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEscapeStack(onClose, mounted && Boolean(file));

  useEffect(() => {
    setView(INITIAL_VIEW);
    viewRef.current = INITIAL_VIEW;
    setIsDragging(false);
    isDraggingRef.current = false;
  }, [file?.url]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const lightbox = lightboxRef.current;
    if (!lightbox || !file || isVideo) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setView((currentView) => {
        const nextScale = clampScale(
          currentView.scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP)
        );
        if (nextScale === currentView.scale) return currentView;

        const imageRect = imageRef.current?.getBoundingClientRect();
        if (!imageRect) return { ...currentView, scale: nextScale };

        const imageCenterX = imageRect.left + imageRect.width / 2;
        const imageCenterY = imageRect.top + imageRect.height / 2;
        const scaleRatio = nextScale / currentView.scale;

        return {
          scale: nextScale,
          x: currentView.x + (event.clientX - imageCenterX) * (1 - scaleRatio),
          y: currentView.y + (event.clientY - imageCenterY) * (1 - scaleRatio),
        };
      });
    };

    lightbox.addEventListener('wheel', handleWheel, { passive: false });
    return () => lightbox.removeEventListener('wheel', handleWheel);
  }, [file, isVideo]);

  const zoomIn = () => setView((currentView) => ({
    ...currentView,
    scale: clampScale(currentView.scale + SCALE_STEP),
  }));
  const zoomOut = () => setView((currentView) => ({
    ...currentView,
    scale: clampScale(currentView.scale - SCALE_STEP),
  }));

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      imageX: viewRef.current.x,
      imageY: viewRef.current.y,
    };
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (!isDraggingRef.current) return;
    const dragStart = dragStartRef.current;
    setView((currentView) => ({
      ...currentView,
      x: dragStart.imageX + event.clientX - dragStart.pointerX,
      y: dragStart.imageY + event.clientY - dragStart.pointerY,
    }));
  }, []);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLImageElement>) => {
    if (!isDraggingRef.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  if (!file || !mounted) return null;

  return createPortal(
    <div 
      ref={lightboxRef}
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-zoom-out select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 text-white z-10"
      >
        <span className="text-xs font-medium truncate max-w-[70%]">
          {file.name}
        </span>
        <div className="flex items-center gap-3" onClick={(event) => event.stopPropagation()}>
          {!isVideo && (
            <>
              <button
                onClick={zoomOut}
                disabled={view.scale <= MIN_SCALE}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="min-w-12 text-center text-xs tabular-nums">
                {Math.round(view.scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={view.scale >= MAX_SCALE}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView(INITIAL_VIEW)}
                disabled={view.scale === 1 && view.x === 0 && view.y === 0}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Reset zoom"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={() => onDownload(file)}
            disabled={isDownloading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isVideo ? (
        <video
          src={file.url}
          controls
          preload="metadata"
          className="max-w-[90vw] max-h-[85vh] rounded-md shadow-2xl mt-10 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="flex max-h-[calc(100vh-3.5rem)] max-w-full items-center justify-center overflow-hidden px-6 pt-10"
        >
          <img
            ref={imageRef}
            src={file.url}
            alt="Preview"
            className={`max-w-[90vw] max-h-[85vh] touch-none object-contain rounded-md shadow-2xl select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab transition-transform duration-150 ease-out'
            }`}
            style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      )}
    </div>,
    document.body,
  );
}
