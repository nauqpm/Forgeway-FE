'use client';

import React from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  side: 'left' | 'right';
  className?: string;
}

export function ResizeHandle({
  onMouseDown,
  onDoubleClick,
  side,
  className = '',
}: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`absolute top-0 ${
        side === 'right' ? '-right-1.5' : '-left-1.5'
      } w-3 h-full cursor-col-resize z-40 group flex items-center justify-center select-none ${className}`}
      title="Drag to resize (Double click to reset)"
    >
      <div className="w-[3px] h-full bg-transparent group-hover:bg-[#2563EB]/60 group-active:bg-[#2563EB] transition-colors rounded-full" />
    </div>
  );
}

export default ResizeHandle;
