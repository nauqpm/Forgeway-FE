'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  align?: 'center' | 'right' | 'left';
}

export default function ActionTooltip({ label, children, align = 'center' }: ActionTooltipProps) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = rect.left + rect.width / 2;
      
      if (align === 'right') {
        x = rect.right;
      } else if (align === 'left') {
        x = rect.left;
      }
      
      setCoords({
        x,
        y: rect.top - 6 // 6px above the button
      });
    }
  }, [show, align]);

  const tooltipClasses = 
    align === 'right' 
      ? 'translate-x-[-100%]' 
      : align === 'left' 
      ? 'translate-x-0' 
      : 'translate-x-[-50%]';

  return (
    <div 
      className="relative flex items-center justify-center"
      ref={triggerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && typeof window !== 'undefined' && createPortal(
        <div 
          style={{ top: coords.y, left: coords.x }}
          className={`fixed -translate-y-full ${tooltipClasses} px-2 py-1 bg-white dark:bg-[#1C1C1C] text-[#111111] dark:text-[#E8E8E7] text-[11px] font-medium rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.12)] whitespace-nowrap z-[99999] pointer-events-none transition-opacity duration-150`}
        >
          {label}
        </div>,
        document.body
      )}
    </div>
  );
}
