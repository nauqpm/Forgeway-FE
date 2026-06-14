"use client";

import { KeyboardEvent, useState } from "react";
import { Loader2, Trash2, LogOut, ShieldAlert } from "lucide-react";

interface WorkspaceDeleteDialogProps {
  workspaceName: string;
  deleting: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export function WorkspaceDeleteDialog({
  workspaceName,
  deleting,
  onDelete,
  onCancel,
}: WorkspaceDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !deleting && confirmText === "delete") {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-[#9F2F2D] dark:text-[#F87171]" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
            Delete workspace
          </h2>
        </div>
        <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-4">
          This action will delete workspace{" "}
          <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
            {workspaceName}
          </span>{" "}
          and cannot be undone. Enter{" "}
          <span className="font-mono font-semibold">delete</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="delete"
          className="w-full mb-4 px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#9F2F2D]"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={confirmText !== "delete" || deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] disabled:bg-[#F5C6C7] disabled:cursor-not-allowed rounded-[6px] transition-colors flex items-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleting ? "Deleting..." : "Confirm delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface LeaveWorkspaceDialogProps {
  workspaceName: string;
  isOwner: boolean;
  leaving: boolean;
  onLeave: () => void;
  onCancel: () => void;
  onGoToDelete: () => void;
}

export function LeaveWorkspaceDialog({
  workspaceName,
  isOwner,
  leaving,
  onLeave,
  onCancel,
  onGoToDelete,
}: LeaveWorkspaceDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !leaving && confirmText === "leave") {
      onLeave();
    }
  };

  if (isOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
              You are the owner of this workspace
            </h2>
          </div>
          <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-6">
            Do you want to delete workspace{" "}
            <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {workspaceName}
            </span>{" "}
            now? This action will delete all data and cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onGoToDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] rounded-[6px] transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Go to delete workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] flex items-center justify-center flex-shrink-0">
            <LogOut className="w-5 h-5 text-[#9F2F2D] dark:text-[#F87171]" />
          </div>
          <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
            Leave workspace
          </h2>
        </div>
        <p className="text-sm text-[#787774] dark:text-[#9B9A97] mb-4">
          You will lose access to workspace{" "}
          <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">
            {workspaceName}
          </span>
          . Enter <span className="font-mono font-semibold">leave</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="leave"
          className="w-full mb-4 px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#9F2F2D]"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#111111] dark:text-[#E8E8E7] bg-[#F9F9F8] dark:bg-[#252525] hover:bg-[#F0F0EE] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onLeave}
            disabled={confirmText !== "leave" || leaving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#9F2F2D] hover:bg-[#8F2927] disabled:bg-[#F5C6C7] disabled:cursor-not-allowed rounded-[6px] transition-colors flex items-center gap-2"
          >
            {leaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {leaving ? "Leaving..." : "Confirm leave"}
          </button>
        </div>
      </div>
    </div>
  );
}
