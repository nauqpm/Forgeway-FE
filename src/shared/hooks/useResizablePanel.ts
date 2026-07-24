import { useState, useCallback } from 'react';

interface UseResizableOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: 'left' | 'right';
  storageKey?: string;
  onWidthChange?: (width: number) => void;
}

export function useResizablePanel({
  defaultWidth,
  minWidth,
  maxWidth,
  side,
  storageKey,
  onWidthChange,
}: UseResizableOptions) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return defaultWidth;
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;
      let animationFrameId: number | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const delta = side === 'right'
            ? moveEvent.clientX - startX
            : startX - moveEvent.clientX;
          const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));
          setWidth(newWidth);
          if (onWidthChange) {
            onWidthChange(newWidth);
          }
        });
      };

      const handleMouseUp = (moveEvent: MouseEvent) => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // Save to localStorage ONLY when dragging ends to avoid blocking the main thread during drag
        const delta = side === 'right'
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;
        const finalWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));

        if (storageKey) {
          try {
            localStorage.setItem(storageKey, String(finalWidth));
          } catch (err) {
            console.error('Failed to save width to localStorage:', err);
          }
        }
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [width, minWidth, maxWidth, side, storageKey, onWidthChange]
  );

  const handleReset = useCallback(() => {
    setWidth(defaultWidth);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.error('Failed to clear width in localStorage:', err);
      }
    }
    if (onWidthChange) {
      onWidthChange(defaultWidth);
    }
  }, [defaultWidth, storageKey, onWidthChange]);

  return {
    width,
    setWidth,
    handleMouseDown,
    handleReset,
  };
}
