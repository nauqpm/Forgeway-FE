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
      toast.error("Could not load workspace list");
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
      toast.success("Workspace links updated successfully");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Could not update workspace links");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-transparent bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-gray-800 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Linked workspaces
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Document:
          </p>
          <p className="mb-4 truncate text-sm text-gray-500 dark:text-gray-400">
            {doc.name}
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading workspace list...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500 dark:border-gray-700">
              You do not have any workspaces yet.
            </div>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700"
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
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-sm dark:border-indigo-800 dark:bg-indigo-900/20">
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

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/30 px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          {showConfirm && hasChanges ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm save
            </button>
          ) : (
            <button
              type="button"
              disabled={!hasChanges}
              onClick={() => setShowConfirm(true)}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}