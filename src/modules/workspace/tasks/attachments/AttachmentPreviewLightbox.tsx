import { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
import { useAttachmentPreview } from "@/modules/workspace/shared/hooks/useAttachmentPreview";
import { TaskAttachment } from "@/modules/workspace/shared/types/attachment.type";

interface AttachmentPreviewLightboxProps {
  workspaceId: string;
  taskId: string;
  attachments: TaskAttachment[];
  activeAttachment: TaskAttachment | null;
  accessToken?: string | null;
  onClose: () => void;
  onSelect: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
}

export default function AttachmentPreviewLightbox({
  workspaceId,
  taskId,
  attachments,
  activeAttachment,
  accessToken,
  onClose,
  onSelect,
  onDownload,
}: AttachmentPreviewLightboxProps) {
  const activeIndex = useMemo(
    () => attachments.findIndex((attachment) => attachment.id === activeAttachment?.id),
    [activeAttachment?.id, attachments],
  );
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < attachments.length - 1;

  const { objectUrl, textContent, isLoading, error } = useAttachmentPreview({
    workspaceId,
    taskId,
    attachment: activeAttachment,
    accessToken,
  });

  useEffect(() => {
    if (!activeAttachment) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasPrevious) onSelect(attachments[activeIndex - 1]);
      if (event.key === "ArrowRight" && hasNext) onSelect(attachments[activeIndex + 1]);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeAttachment, activeIndex, attachments, hasNext, hasPrevious, onClose, onSelect]);

  if (!activeAttachment) return null;

  const previewBody = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    if (error || !objectUrl) {
      return (
        <div className="flex h-full items-center justify-center px-6 text-center text-[0.8125rem] text-white/60">
          {error || "Preview is not available."}
        </div>
      );
    }

    if (activeAttachment.mimeType.startsWith("image/")) {
      return (
        <img
          src={objectUrl}
          alt={activeAttachment.originalName}
          className="max-h-full max-w-full object-contain"
        />
      );
    }

    if (activeAttachment.mimeType === "text/plain") {
      return (
        <pre className="h-full w-full overflow-auto rounded-[6px] bg-white p-4 text-left text-sm text-[#111111] dark:bg-[#252525] dark:text-[#E8E8E7]">
          {textContent}
        </pre>
      );
    }

    return (
      <iframe
        src={objectUrl}
        title={activeAttachment.originalName}
        className="h-full w-full rounded bg-white"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col bg-black/95 text-white">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{activeAttachment.originalName}</p>
          <p className="text-xs text-[#9B9A97]">
            {activeIndex + 1} of {attachments.length}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDownload(activeAttachment)}
            className="rounded-[6px] p-2 text-[#9B9A97] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Download attachment"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-2 text-[#9B9A97] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 p-4">
        <div className="flex h-full items-center justify-center">{previewBody()}</div>
        {hasPrevious && (
          <button
            type="button"
            onClick={() => onSelect(attachments[activeIndex - 1])}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-[8px] bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Previous attachment"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={() => onSelect(attachments[activeIndex + 1])}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[8px] bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Next attachment"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
