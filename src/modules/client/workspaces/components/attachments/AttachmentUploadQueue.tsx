import { CheckCircle2, X, XCircle } from "lucide-react";
import { UploadQueueItem } from "../../types/attachment.type";
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
          className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <AttachmentFileIcon mimeType={item.mimeType} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatAttachmentSize(item.fileSize)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {item.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                  <button
                    type="button"
                    onClick={() => onClear(item.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    aria-label="Clear upload row"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === "error"
                      ? "bg-red-500"
                      : item.status === "success"
                        ? "bg-emerald-500"
                        : "bg-[#0052CC]"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p
                className={`mt-1 text-xs ${
                  item.status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
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
