import { isPreviewableAttachment, TaskAttachment } from "@/modules/workspace/shared/types/attachment.type";
import AttachmentActions from "./AttachmentActions";
import AttachmentFileIcon from "./AttachmentFileIcon";
import { formatAttachmentDate, formatAttachmentSize } from "./attachmentFormatters";
import { useAttachmentPreview } from "@/modules/workspace/shared/hooks/useAttachmentPreview";

interface AttachmentImageGridProps {
  workspaceId: string;
  taskId: string;
  accessToken?: string | null;
  attachments: TaskAttachment[];
  canDeleteAttachment: (attachment: TaskAttachment) => boolean;
  onPreview: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachment: TaskAttachment) => void;
}

function AttachmentThumbnail({
  workspaceId,
  taskId,
  accessToken,
  attachment,
}: {
  workspaceId: string;
  taskId: string;
  accessToken?: string | null;
  attachment: TaskAttachment;
}) {
  const { objectUrl, isLoading } = useAttachmentPreview({ workspaceId, taskId, attachment, accessToken });

  if (!objectUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F7F6F3] dark:bg-[#252525] text-[#ABABAB] dark:text-[#6B6B6B]">
        <AttachmentFileIcon mimeType={attachment.mimeType} className="h-8 w-8" />
        <span className="max-w-[80%] truncate text-[0.6875rem] font-medium">
          {isLoading ? "Loading preview..." : attachment.originalName}
        </span>
      </div>
    );
  }

  if (attachment.mimeType.startsWith("video/")) {
    return (
      <video
        src={objectUrl}
        className="h-full w-full object-cover"
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={objectUrl}
      alt={attachment.originalName}
      className="h-full w-full object-cover"
    />
  );
}

export default function AttachmentImageGrid({
  workspaceId,
  taskId,
  accessToken,
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
          className="group overflow-hidden rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]"
        >
          <button
            type="button"
            onClick={() => onPreview(attachment)}
            className="block aspect-video w-full overflow-hidden bg-[#F7F6F3] dark:bg-[#252525]"
            aria-label={`Preview ${attachment.originalName}`}
          >
            <AttachmentThumbnail
              workspaceId={workspaceId}
              taskId={taskId}
              accessToken={accessToken}
              attachment={attachment}
            />
          </button>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
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
          </div>
        </div>
      ))}
    </div>
  );
}
