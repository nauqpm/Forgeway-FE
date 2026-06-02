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
        toast.error(error?.response?.data?.message || "Khong tai duoc labels");
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
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId],
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
      toast.success("Da tao label");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong tao duoc label");
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
      onSaved({
        ...issue,
        labels: nextIssueLabels,
        labelIds: nextSelectedIds,
      });
      setLabelToDelete(null);
      toast.success("Da xoa label");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong xoa duoc label");
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
      toast.success("Da cap nhat label");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Khong cap nhat duoc label");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Tag className="h-5 w-5" />
              Labels
            </h3>
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
              {issue.key} - {issue.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
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
              onChange={(event) => setNewLabelName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleCreateLabel();
                if (event.key === "Escape") onClose();
              }}
              placeholder="Write label"
              className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-950"
            />
            <button
              type="button"
              onClick={handleCreateLabel}
              disabled={creating || !newLabelName.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search labels"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-950"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 p-1 dark:border-gray-800">
            {loading ? (
              <div className="flex h-28 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading labels
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No labels found
              </div>
            ) : (
              filteredLabels.map((label) => {
                const active = selectedIds.includes(label.id);
                return (
                  <div
                    key={label.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
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
                      className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
              <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      Delete label
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Delete <span className="font-semibold text-gray-700 dark:text-gray-200">"{labelToDelete.name}"</span>? This will remove it from all tasks.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4">
                <button
                  type="button"
                  onClick={() => setLabelToDelete(null)}
                  disabled={deletingIds.includes(labelToDelete.id)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteLabel}
                  disabled={deletingIds.includes(labelToDelete.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingIds.includes(labelToDelete.id) && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
