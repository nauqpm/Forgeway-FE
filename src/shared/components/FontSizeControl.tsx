"use client";

import { useFontSize, type FontScale } from "@/shared/hooks/useFontSize";

const OPTIONS: { id: FontScale; label: string; description: string; preview: string }[] = [
  { id: "sm",  label: "Small",   description: "Compact text",  preview: "A" },
  { id: "md",  label: "Default", description: "Standard size", preview: "A" },
  { id: "lg",  label: "Large",   description: "Easier to read", preview: "A" },
  { id: "xl",  label: "Extra Large", description: "Maximum size", preview: "A" },
];

const PREVIEW_SIZE: Record<FontScale, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

export default function FontSizeControl() {
  const { fontScale, setFontScale } = useFontSize();

  return (
    <div className="p-6 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] w-full">
      <div className="mb-6">
        <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">Text size</h2>
        <p className="text-[0.8125rem] text-[#787774] dark:text-[#9B9A97] mt-1">
          Adjust the font size across the entire interface.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setFontScale(option.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-[8px] border-2 transition-all duration-200 ${
              fontScale === option.id
                ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
                : "border-[#EAEAEA] dark:border-white/[0.06] text-[#787774] dark:text-[#9B9A97] hover:border-[#2563EB]/30 hover:bg-[#F7F6F3] dark:hover:bg-white/5"
            }`}
          >
            <span className={`font-bold mb-2 leading-none ${PREVIEW_SIZE[option.id]}`}>
              {option.preview}
            </span>
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-center mt-1 opacity-70">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
