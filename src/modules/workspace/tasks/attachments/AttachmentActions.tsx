import { Download, Eye, Trash2 } from "lucide-react";
import { TaskAttachment } from "@/modules/workspace/shared/types/attachment.type";

interface AttachmentActionsProps {
  attachment: TaskAttachment;
  canPreview: boolean;
  canDelete: boolean;
  onPreview: (attachment: TaskAttachment) => void;
  onDownload: (attachment: TaskAttachment) => void;
  onDelete: (attachment: TaskAttachment) => void;
}

export default function AttachmentActions({
  attachment,
  canPreview,
  canDelete,
  onPreview,
  onDownload,
  onDelete,
}: AttachmentActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {canPreview && (
        <button
          type="button"
          onClick={() => onPreview(attachment)}
          className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          aria-label="Preview attachment"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onDownload(attachment)}
        className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
        aria-label="Download attachment"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(attachment)}
          className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] hover:text-[#9F2F2D] dark:hover:text-[#F87171]"
          aria-label="Delete attachment"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
