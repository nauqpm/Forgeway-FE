"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { ArrowLeft, BookOpen, Lock, Globe } from "lucide-react";
import Link from "next/link";

export default function CreateSpacePage() {
  const router = useRouter();
  const { currentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [form, setForm] = useState({ name: "", key: "", description: "", type: "public" as "public" | "private" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageReady, setPageReady] = useState(false);
  const [wsError, setWsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWsError("");
    api.get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (!cancelled) {
          setWorkspaces(res.data);
          setPageReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setWsError(e?.response?.data?.message || e?.message || "Failed to load workspaces");
          setPageReady(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!currentWorkspace?._id) {
      setError("Please select a workspace first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(apiRoutes.SPACES.BASE, {
        ...form,
        workspaceId: currentWorkspace._id,
      });
      router.push(`/spaces/${res.data._id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create space. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) return (
    <div className="p-6 text-center text-gray-500">
      {wsError ? (
        <div>
          <p className="text-red-500 mb-2">Error: {wsError}</p>
          <p className="text-sm text-gray-400">Please make sure you are logged in and the backend is running.</p>
        </div>
      ) : "Loading..."}
    </div>
  );

  if (!currentWorkspace) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 mb-4">No workspace found. Please create a workspace first.</p>
      <p className="text-xs text-gray-400">Workspace error: {wsError}</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/spaces" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Space</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            in <span className="font-medium text-indigo-600">{currentWorkspace.name}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Space Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, key: e.target.value.toUpperCase().replace(/\s+/g, "-") })} required
              placeholder="e.g., Engineering Docs, HR Handbook"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Space Key *</label>
            <input type="text" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, "") })} required
              placeholder="e.g., ENG, HR, DOCS"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            <p className="text-xs text-gray-400 mt-1">A unique key used in URLs. Use uppercase letters and numbers only.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              placeholder="What is this space for?"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="flex gap-3">
              {[
                { value: "public", label: "Public", desc: "All workspace members can view", icon: Globe },
                { value: "private", label: "Private", desc: "Only invited members can view", icon: Lock },
              ].map((opt) => (
                <label key={opt.value} className={`flex-1 flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${form.type === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="type" value={opt.value} checked={form.type === opt.value}
                    onChange={() => setForm({ ...form, type: opt.value as "public" | "private" })}
                    className="mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link href="/spaces" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? "Creating..." : <><BookOpen className="w-4 h-4" /> Create Space</>}
          </button>
        </div>
      </form>
    </div>
  );
}
