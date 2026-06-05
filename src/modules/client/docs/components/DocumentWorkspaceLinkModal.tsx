"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Link2, X, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { DocumentItem } from "../types/document.type";
import { documentService } from "../services/documentService";
import { workspaceService } from "@/modules/client/workspaces/services/workspaceService";
import { Workspace } from "@/modules/client/workspaces/types/workspace.type";

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initialIds = useMemo(
    () => new Set(doc.workspaceIds ?? []),
    [doc.workspaceIds],
  );

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const list = await workspaceService.listMine();
      setWorkspaces(list);
      setSelected(new Set(doc.workspaceIds ?? []));
    } catch {
      toast.error("Không thể tải danh sách workspace");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [doc.workspaceIds, onClose]);

  useEffect(() => {
    if (open) {
      loadWorkspaces();
      setShowConfirm(false);
    }
  }, [open, loadWorkspaces]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentService.updateWorkspaces(doc._id, Array.from(selected));
      toast.success("Cập nhật liên kết workspace thành công");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Cập nhật liên kết workspace thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[10px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] animate-in fade-in zoom-in duration-200"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAEAEA] dark:border-white/8 p-5">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#2563EB] dark:text-[#3B82F6]" />
            <h3 className="text-[15px] font-bold text-[#111111] dark:text-[#E8E8E7]">
              Liên kết workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-[4px] p-1.5 text-[#ABABAB] dark:text-[#6B6B6B] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-[#E8E8E7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="mb-1 text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7]">
            Tài liệu:
          </p>
          <p className="mb-4 truncate text-[13px] text-[#787774] dark:text-[#9B9A97]">
            {doc.name}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[13px] text-[#787774] dark:text-[#9B9A97]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải danh sách workspace...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-[8px] border border-dashed border-[#EAEAEA] dark:border-white/10 py-6 text-center text-[13px] text-[#787774] dark:text-[#9B9A97]">
              Bạn chưa có workspace nào.
            </div>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#ABABAB] dark:text-[#6B6B6B]">
                Chọn workspace
              </p>
              <div className="flex flex-wrap gap-2">
                {workspaces.map((ws) => {
                  const isActive = selected.has(ws._id);
                  return (
                    <button
                      key={ws._id}
                      type="button"
                      onClick={() => toggle(ws._id)}
                      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[13px] font-medium transition-all ${
                        isActive
                          ? "border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]"
                          : "border-[#EAEAEA] dark:border-white/8 bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] hover:border-[#2563EB]/20 hover:bg-[#EFF6FF] dark:hover:bg-[rgba(37,99,235,0.08)]"
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

          {/* Inline confirm summary */}
          {showConfirm && hasChanges && (
            <div className="mt-4 rounded-[8px] border border-[#2563EB]/20 dark:border-[rgba(37,99,235,0.2)] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.08)] p-3 text-[13px]">
              {added.length > 0 && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  <span className="font-semibold">+ Thêm:</span>{" "}
                  {added.map((ws) => ws.name).join(", ")}
                </p>
              )}
              {removed.length > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  <span className="font-semibold">− Bỏ:</span>{" "}
                  {removed.map((ws) => ws.name).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#EAEAEA] dark:border-white/8 bg-[#F9F9F8] dark:bg-[#252525] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] border border-[#EAEAEA] dark:border-white/10 px-5 py-2.5 text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-white/5"
          >
            Huỷ
          </button>
          {showConfirm && hasChanges ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Xác nhận lưu
            </button>
          ) : (
            <button
              type="button"
              disabled={!hasChanges}
              onClick={() => setShowConfirm(true)}
              className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
