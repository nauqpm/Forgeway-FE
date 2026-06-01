import { isPreviewableAttachment, TaskAttachment } from "../../types/attachment.type";
import AttachmentActions from "./AttachmentActions";
import AttachmentFileIcon from "./AttachmentFileIcon";
import { formatAttachmentDate, formatAttachmentSize } from "./attachmentFormatters";

interface AttachmentImageGridProps {
  attachments: TaskAttachment[];
  canDeleteAttachment: (attachment: TaskAttachment) => boolean;
  onPreview: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachment: TaskAttachment) => void;
}

export default function AttachmentImageGrid({
  attachments,
  canDeleteAttachment,
  onPreview,
  onDownload,
  onDelete,
}: AttachmentImageGridProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="group overflow-hidden rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        >
          <button
            type="button"
            onClick={() => onPreview(attachment)}
            className="block aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
            aria-label={`Preview ${attachment.originalName}`}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <AttachmentFileIcon mimeType={attachment.mimeType} className="h-8 w-8" />
              <span className="max-w-[80%] truncate text-xs font-medium">
                {attachment.originalName}
              </span>
            </div>
          </button>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {attachment.originalName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatAttachmentSize(attachment.size)} - {formatAttachmentDate(attachment.createdAt)}
                </p>
              </div>
              <AttachmentActions
                attachment={attachment}
                canPreview={isPreviewableAttachment(attachment)}
                canDelete={canDeleteAttachment(attachment)}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
