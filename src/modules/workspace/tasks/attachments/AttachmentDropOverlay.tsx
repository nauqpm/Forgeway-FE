import { UploadCloud } from "lucide-react";

interface AttachmentDropOverlayProps {
  visible: boolean;
}

export default function AttachmentDropOverlay({ visible }: AttachmentDropOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[8px] border-2 border-dashed border-[#2563EB] dark:border-[#3B82F6] bg-[#EFF6FF]/90 dark:bg-[rgba(37,99,235,0.12)]">
      <div className="flex flex-col items-center gap-2 text-[#2563EB] dark:text-[#3B82F6]">
        <UploadCloud className="h-8 w-8" />
        <span className="text-[0.8125rem] font-semibold">Drop files to attach</span>
      </div>
    </div>
  );
}
