"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Link2, X, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";
import { useWorkspaces } from "@/modules/workspace/shared/hooks/useWorkspaces";

type Props = {
  doc: DocumentItem;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export default function DocumentWorkspaceLinkModal({
  doc,
  open,
  onClose,
  onSaved,
}: Props) {
  const { data: workspaces = [], isLoading: loading, error: workspacesError } = useWorkspaces();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const initialIds = useMemo(
    () => new Set(doc.workspaceIds ?? []),
    [doc.workspaceIds],
  );

  useEffect(() => {
    if (open) {
      setSelected(new Set(doc.workspaceIds ?? []));
      setShowConfirm(false);
    }
  }, [doc.workspaceIds, open]);

  useEffect(() => {
    if (open && workspacesError) {
      toast.error("Could not load workspace list");
      onClose();
    }
  }, [onClose, open, workspacesError]);

  const toggle = (id: string) => {
    setShowConfirm(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const added = useMemo(
    () => workspaces.filter((ws) => selected.has(ws._id) && !initialIds.has(ws._id)),
    [workspaces, selected, initialIds],
  );

  const removed = useMemo(
    () => workspaces.filter((ws) => !selected.has(ws._id) && initialIds.has(ws._id)),
    [workspaces, selected, initialIds],
  );

  const hasChanges = added.length > 0 || removed.length > 0;

  const updateWorkspacesMutation = useMutation({
    mutationFn: () => documentService.updateWorkspaces(doc._id, Array.from(selected)),
    onSuccess: () => {
      toast.success("Workspace links updated successfully");
      onSaved?.();
      onClose();
    },
    onError: () => {
      toast.error("Could not update workspace links");
    },
  });

  const handleSave = () => updateWorkspacesMutation.mutate();
  const saving = updateWorkspacesMutation.isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020] animate-in fade-in zoom-in duration-200"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EAEAEA] dark:border-white/[0.06] p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
            <h3 className="text-[0.9375rem] font-bold text-[#111111] dark:text-[#E8E8E7]">
              Linked workspaces
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-1 text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
            Document:
          </p>
          <p className="mb-4 truncate text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            {doc.name}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading workspace list...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#EAEAEA] dark:border-white/[0.06] py-6 text-center text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
              You do not have any workspaces yet.
            </div>
          ) : (
            <>
              <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
                Select workspaces
              </p>
              <div className="flex flex-wrap gap-2">
                {workspaces.map((ws) => {
                  const isActive = selected.has(ws._id);
                  return (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => toggle(ws._id)}
                      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[0.8125rem] font-medium transition-all ${
                        isActive
                          ? "border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]"
                          : "border-[#EAEAEA] dark:border-white/[0.06] bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:border-[#2563EB]/20 hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.08)]"
                      }`}
                    >
                      {isActive && <Check className="h-3.5 w-3.5" />}
                      {ws.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {showConfirm && hasChanges && (
            <div className="mt-4 rounded-[8px] border border-[#2563EB]/20 dark:border-[rgba(37,99,235,0.2)] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] p-3 text-[0.8125rem]">
              {added.length > 0 && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">+ Add:</span>{" "}
                  {added.map((ws) => ws.name).join(", ")}
                </p>
              )}
              {removed.length > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  <span className="font-semibold">- Remove:</span>{" "}
                  {removed.map((ws) => ws.name).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#EAEAEA] dark:border-white/[0.06] bg-[#F9F9F8] dark:bg-[#252525] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] px-5 py-2.5 text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5"
          >
            Cancel
          </button>
          {showConfirm && hasChanges ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm save
            </button>
          ) : (
            <button
              type="button"
              disabled={!hasChanges}
              onClick={() => setShowConfirm(true)}
              className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
