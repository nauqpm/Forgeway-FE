import { UploadCloud } from "lucide-react";

interface AttachmentDropOverlayProps {
  visible: boolean;
}

export default function AttachmentDropOverlay({ visible }: AttachmentDropOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-[#0052CC] bg-blue-50/90 dark:bg-blue-950/70">
      <div className="flex flex-col items-center gap-2 text-[#0052CC] dark:text-blue-200">
        <UploadCloud className="h-8 w-8" />
        <span className="text-sm font-semibold">Drop files to attach</span>
      </div>
    </div>
  );
}
