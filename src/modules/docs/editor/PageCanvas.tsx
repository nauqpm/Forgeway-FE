// Component representing document page canvas in the editor, 
// where users edit document content.
"use client";

import React from "react";

interface PageCanvasProps {
  children: React.ReactNode;
}

export default function PageCanvas({ children }: PageCanvasProps) {
  return (
    <div className="w-full bg-[#F8F9FA] dark:bg-gray-900 min-h-full py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="w-[816px] min-h-[1056px] mx-auto bg-white dark:bg-gray-950 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] dark:shadow-none border border-gray-200/50 dark:border-gray-800/80 p-[96px] print:w-full print:min-h-0 print:shadow-none print:border-none print:p-0">
        {children}
      </div>
    </div>
  );
}
