"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, Loader2, Plus, Search, Tag, Trash2, X } from "lucide-react";
import type { Issue } from "../../types/issue.type";
import type { TaskLabel } from "../../types/label.type";
import { labelService } from "../../services/labelService";
import { taskService } from "../../services/taskService";

type TaskLabelModalProps = {
  isOpen: boolean;
  workspaceId: string;
  issue: Issue;
  onClose: () => void;
  onSaved: (issue: Issue) => void;
};

const inputCls = "h-10 w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-3 text-[13px] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]";

export default function TaskLabelModal({
  isOpen,
  workspaceId,
  issue,
  onClose,
  onSaved,
}: TaskLabelModalProps) {
  const [labels, setLabels] = useState<TaskLabel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [labelToDelete, setLabelToDelete] = useState<TaskLabel | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(issue.labelIds ?? issue.labels?.map((label) => label.id) ?? []);
    setQuery("");
    setNewLabelName("");
    setDeletingIds([]);
    setLabelToDelete(null);
    setLoading(true);
    labelService
      .listLabels(workspaceId)
      .then(setLabels)
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Could not load labels");
      })
      .finally(() => setLoading(false));
  }, [isOpen, issue, workspaceId]);

  const filteredLabels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return labels;
    return labels.filter((label) => label.name.toLowerCase().includes(normalizedQuery));
  }, [labels, query]);

  const toggleLabel = (labelId: string) => {
    setSelectedIds((current) =>
      current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    );
  };

  const handleCreateLabel = async () => {
    const name = newLabelName.trim();
    if (!name) return;
    const existing = labels.find((label) => label.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelectedIds((current) => current.includes(existing.id) ? current : [...current, existing.id]);
      setNewLabelName("");
      return;
    }
    setCreating(true);
    try {
      const createdLabel = await labelService.createLabel(workspaceId, name);
      setLabels((current) => [...current, createdLabel]);
      setSelectedIds((current) => [...current, createdLabel.id]);
      setNewLabelName("");
      toast.success("Label created");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create label");
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteLabel = async () => {
    if (!labelToDelete) return;
    const label = labelToDelete;
    setDeletingIds((current) => [...current, label.id]);
    try {
      await labelService.deleteLabel(workspaceId, label.id);
      const nextLabels = labels.filter((item) => item.id !== label.id);
      const nextSelectedIds = selectedIds.filter((id) => id !== label.id);
      const nextIssueLabels = (issue.labels ?? []).filter((item) => item.id !== label.id);
      setLabels(nextLabels);
      setSelectedIds(nextSelectedIds);
      onSaved({ ...issue, labels: nextIssueLabels, labelIds: nextSelectedIds });
      setLabelToDelete(null);
      toast.success("Label deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete label");
    } finally {
      setDeletingIds((current) => current.filter((id) => id !== label.id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedIssue = await taskService.replaceTaskLabels(workspaceId, issue.id, selectedIds);
      const selectedLabels = labels.filter((label) => selectedIds.includes(label.id));
      onSaved({
        ...updatedIssue,
        labels: selectedLabels,
        labelIds: selectedIds,
      });
      toast.success("Label updated");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update label");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const cancelBtnCls = "rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.08] bg-white dark:bg-[#252525] px-4 py-2 text-[13px] font-medium text-[#111111] dark:text-[#E8E8E7] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EAEAEA] dark:border-white/[0.06] p-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              <Tag className="h-4 w-4 text-[#2563EB] dark:text-[#3B82F6]" />
              Labels
            </h3>
            <p className="mt-1 truncate text-[13px] text-[#787774] dark:text-[#9B9A97]">
              {issue.key} - {issue.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-[#ABABAB] transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] hover:text-[#111111] dark:hover:text-[#E8E8E7]"
            aria-label="Close labels"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateLabel();
                if (e.key === "Escape") onClose();
              }}
              placeholder="Write label"
              className={inputCls}
            />
            <button
              type="button"
              onClick={handleCreateLabel}
              disabled={creating || !newLabelName.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ABABAB]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search labels"
              className={`${inputCls} pl-9`}
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06] p-1">
            {loading ? (
              <div className="flex h-28 items-center justify-center text-[13px] text-[#787774] dark:text-[#9B9A97]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading labels
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="px-3 py-8 text-center text-[13px] text-[#787774] dark:text-[#9B9A97]">
                No labels found
              </div>
            ) : (
              filteredLabels.map((label) => {
                const active = selectedIds.includes(label.id);
                return (
                  <div
                    key={label.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-3 py-2 text-left text-[13px] transition-colors ${
                      active
                        ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#1F6C9F] dark:text-[#93C5FD]"
                        : "text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    >
                      <span className="min-w-0 truncate">{label.name}</span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLabelToDelete(label)}
                      disabled={deletingIds.includes(label.id)}
                      className="shrink-0 rounded-[4px] p-1 text-[#ABABAB] transition-colors hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] hover:text-[#9F2F2D] dark:hover:text-[#F87171] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${label.name}`}
                      title="Delete label"
                    >
                      {deletingIds.includes(label.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {labelToDelete && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
            <div
              className="w-full max-w-sm overflow-hidden rounded-[10px] border border-[#EAEAEA] dark:border-white/[0.06] bg-white dark:bg-[#202020]"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div className="border-b border-[#EAEAEA] dark:border-white/[0.06] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] text-[#9F2F2D] dark:text-[#F87171]">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-semibold text-[#111111] dark:text-[#E8E8E7]">Delete label</h4>
                    <p className="mt-1 text-[13px] text-[#787774] dark:text-[#9B9A97]">
                      Delete{" "}
                      <span className="font-semibold text-[#111111] dark:text-[#E8E8E7]">"{labelToDelete.name}"</span>?
                      {" "}This will remove it from all tasks.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4">
                <button
                  type="button"
                  onClick={() => setLabelToDelete(null)}
                  disabled={deletingIds.includes(labelToDelete.id)}
                  className={cancelBtnCls}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteLabel}
                  disabled={deletingIds.includes(labelToDelete.id)}
                  className="inline-flex items-center gap-2 rounded-[6px] bg-[#9F2F2D] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#8F2927] dark:hover:bg-[#F87171]/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingIds.includes(labelToDelete.id) && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-[#EAEAEA] dark:border-white/[0.06] p-4">
          <button type="button" onClick={onClose} className={cancelBtnCls}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
