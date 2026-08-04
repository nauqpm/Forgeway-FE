// Component representing document page canvas in the editor, 
// where users edit document content.
"use client";

import React from "react";

interface PageCanvasProps {
  children: React.ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
  return (
    <div className="w-full bg-[#F8F9FA] dark:bg-[#202020] min-h-full py-4 px-3 print:bg-white print:py-0 print:px-0">
      <div className="w-[816px] min-h-[1056px] mx-auto bg-white text-gray-900 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] border border-gray-200/50 p-[96px] dark:border-white/[0.12] dark:bg-[#202020] dark:text-[#E8E8E7] print:w-full print:min-h-0 print:shadow-none print:border-none print:bg-white print:text-black print:p-0">
        {children}
      </div>
    </div>
  );
}
