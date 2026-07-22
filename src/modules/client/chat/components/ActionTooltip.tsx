'use client';

import React, { useState } from 'react';

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  align?: 'center' | 'right' | 'left';
}

export default function ActionTooltip({ label, children, align = 'center' }: ActionTooltipProps) {
  const [show, setShow] = useState(false);

  const alignClasses = 
    align === 'right' 
      ? 'right-0' 
      : align === 'left' 
      ? 'left-0' 
      : 'left-1/2 -translate-x-1/2';

  return (
    <div 
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`absolute bottom-full mb-1.5 ${alignClasses} px-2 py-1 bg-white dark:bg-[#1C1C1C] text-[#111111] dark:text-[#E8E8E7] text-[11px] font-medium rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.12)] whitespace-nowrap z-[100] pointer-events-none transition-opacity duration-150`}>
          {label}
        </div>
      )}
    </div>
  );
}
