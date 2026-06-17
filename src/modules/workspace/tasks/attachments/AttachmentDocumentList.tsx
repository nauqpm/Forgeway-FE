import { isPreviewableAttachment, TaskAttachment } from "@/modules/workspace/shared/types/attachment.type";
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
    <div className="divide-y divide-[#EAEAEA] dark:divide-white/[0.06] overflow-hidden rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-3 p-3">
          <div className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] p-2 text-[#787774] dark:text-[#9B9A97]">
            <AttachmentFileIcon mimeType={attachment.mimeType} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
              {attachment.originalName}
            </p>
            <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
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
