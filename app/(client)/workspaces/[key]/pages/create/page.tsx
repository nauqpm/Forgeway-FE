"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { resolveWorkspaceFromRouteKey } from "@/modules/workspace/shared/services/resolveWorkspace";
import { queryKeys } from "@/shared/constants/queryKeys";

export default function CreateWorkspacePage({ params }: { params: Promise<{ key: string }> }) {
  usePageTitle("New Page");
  const { key } = use(params);
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    content: "",
    labels: "",
  });
  const [labelInput, setLabelInput] = useState("");

  const workspaceQuery = useQuery({
    queryKey: queryKeys.workspaces.bySlug(key),
    queryFn: () => resolveWorkspaceFromRouteKey(key),
    enabled: !!key,
  });
  const workspaceId = workspaceQuery.data?._id ?? "";

  useEffect(() => {
    if (workspaceQuery.error) toast.error("Workspace not found");
  }, [workspaceQuery.error]);

  const createPageMutation = useMutation({
    mutationFn: async () => {
      const labels = form.labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      const res = await api.post(apiRoutes.PAGES.BASE, {
        title: form.title.trim(),
        content: form.content,
        workspaceId,
        labels,
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (created) => {
      toast.success("Page created in workspace");
      router.push(`/workspaces/${key}/pages/${created.slug}`);
    },
    onError: () => {
      toast.error("Could not create page");
    },
  });

  const loading = createPageMutation.isPending;
  const resolvingWorkspace = workspaceQuery.isLoading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !workspaceId) return;

    createPageMutation.mutate();
  };

  const addLabel = () => {
    const nextLabel = labelInput.trim();
    if (!nextLabel) return;

    const current = form.labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
    if (!current.includes(nextLabel)) {
      setForm((curr) => ({ ...curr, labels: [...current, nextLabel].join(", ") }));
    }
    setLabelInput("");
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12 px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/workspaces/${key}/pages`}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Workspace Page</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Create a page that belongs to this workspace.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="workspace-panel space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Page title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))}
              required
              placeholder="Enter page title"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((curr) => ({ ...curr, content: e.target.value }))}
              rows={12}
              placeholder="Write your workspace page content..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Labels</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                placeholder="Type a label and press Enter"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={addLabel}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.labels && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.labels
                  .split(",")
                  .map((label) => label.trim())
                  .filter(Boolean)
                  .map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {label}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-[var(--workspace-surface-pad)] py-4 dark:border-gray-700 dark:bg-gray-800">
          <Link
            href={`/workspaces/${key}/pages`}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || resolvingWorkspace || !workspaceId || !form.title.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Create Page
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
