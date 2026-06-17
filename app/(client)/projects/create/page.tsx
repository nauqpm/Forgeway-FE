"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/constants/queryKeys";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { ArrowLeft, LayoutGrid, Zap } from "lucide-react";
import Link from "next/link";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useCurrentWorkspace();
  const [form, setForm] = useState({ name: "", key: "", description: "", type: "kanban" as "kanban" | "scrum" });
  const [error, setError] = useState("");

  const createProjectMutation = useMutation({
    mutationFn: (newProject: typeof form) =>
      api.post(apiRoutes.PROJECTS.BASE, { ...newProject, workspaceId: currentWorkspace?._id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(currentWorkspace?._id) });
      router.push(`/projects/${res.data._id}`);
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Failed to create project");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setError("");
    createProjectMutation.mutate(form);
  };

  const loading = createProjectMutation.isPending;

  if (!currentWorkspace) return <div className="app-main text-center text-gray-500">Select a workspace first</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Project</h1>
      </div>
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <form
        onSubmit={handleSubmit}
        className="workspace-panel bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                key: e.target.value.toUpperCase().replace(/\s+/g, "").substring(0, 5),
              })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
            placeholder="Website Redesign"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Key *</label>
          <input
            type="text"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().substring(0, 10) })}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 font-mono"
            placeholder="WEB"
            maxLength={10}
            required
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Task keys: {form.key || "KEY"}-1, {form.key || "KEY"}-2
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            placeholder="Project description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Type *</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "kanban", label: "Kanban", desc: "Visual board", icon: LayoutGrid },
              { value: "scrum", label: "Scrum", desc: "Sprints and backlogs", icon: Zap },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, type: opt.value as "kanban" | "scrum" })}
                className={`p-4 border-2 rounded-xl text-left ${form.type === opt.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
              >
                <opt.icon
                  className={`w-6 h-6 mb-2 ${form.type === opt.value ? "text-indigo-600" : "text-gray-400 dark:text-gray-500"}`}
                />
                <p className="font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/projects"
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
