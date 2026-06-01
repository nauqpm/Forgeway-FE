import { isPreviewableAttachment, TaskAttachment } from "../../types/attachment.type";
import AttachmentActions from "./AttachmentActions";
import AttachmentFileIcon from "./AttachmentFileIcon";
import { formatAttachmentDate, formatAttachmentSize } from "./attachmentFormatters";

interface AttachmentDocumentListProps {
  attachments: TaskAttachment[];
  canDeleteAttachment: (attachment: TaskAttachment) => boolean;
  onPreview: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachment: TaskAttachment) => void;
}

export default function AttachmentDocumentList({
  attachments,
  canDeleteAttachment,
  onPreview,
  onDownload,
  onDelete,
}: AttachmentDocumentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-3 p-3">
          <div className="rounded bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <AttachmentFileIcon mimeType={attachment.mimeType} />
          </div>
          <div className="min-w-0 flex-1">
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
      ))}
    </div>
  );
}
