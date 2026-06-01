import { Download, Eye, Trash2 } from "lucide-react";
import { TaskAttachment } from "../../types/attachment.type";

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
          className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Preview attachment"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onDownload(attachment)}
        className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Download attachment"
        title="Download"
      >
        <Download className="h-4 w-4" />
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(attachment)}
          className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          aria-label="Delete attachment"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
