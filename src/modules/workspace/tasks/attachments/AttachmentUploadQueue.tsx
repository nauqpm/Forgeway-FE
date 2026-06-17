import { CheckCircle2, X, XCircle } from "lucide-react";
import { UploadQueueItem } from "@/modules/workspace/shared/types/attachment.type";
import AttachmentFileIcon from "./AttachmentFileIcon";
import { formatAttachmentSize } from "./attachmentFormatters";

interface AttachmentUploadQueueProps {
  items: UploadQueueItem[];
  onClear: (id: string) => void;
}

export default function AttachmentUploadQueue({
  items,
  onClear,
}: AttachmentUploadQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] p-3"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] p-2 text-[#787774] dark:text-[#9B9A97]">
              <AttachmentFileIcon mimeType={item.mimeType} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
                    {item.fileName}
                  </p>
                  <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                    {formatAttachmentSize(item.fileSize)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-[#346538] dark:text-[#4ADE80]" />
                  )}
                  {item.status === "error" && (
                    <XCircle className="h-4 w-4 text-[#9F2F2D] dark:text-[#F87171]" />
                  )}
                  <button
                    type="button"
                    onClick={() => onClear(item.id)}
                    className="rounded-[4px] p-1 text-[#ABABAB] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
                    aria-label="Clear upload row"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAEAEA] dark:bg-[#2A2A2A]">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === "error"
                      ? "bg-[#9F2F2D]"
                      : item.status === "success"
                        ? "bg-[#346538]"
                        : "bg-[#2563EB] dark:bg-[#3B82F6]"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p
                className={`mt-1 text-[0.6875rem] ${
                  item.status === "error"
                    ? "text-[#9F2F2D] dark:text-[#F87171]"
                    : "text-[#ABABAB] dark:text-[#6B6B6B]"
                }`}
              >
                {item.status === "error"
                  ? item.error || "Upload failed."
                  : item.status === "success"
                    ? "Upload complete."
                    : `${item.progress}% uploaded`}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
