"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default function CreateSpacePage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [form, setForm] = useState({ name: "", key: "", description: "", type: "public" as "public" | "private" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post(apiRoutes.SPACES.BASE, { ...form, workspaceId: currentWorkspace._id });
      router.push(`/spaces/${res.data._id}`);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to create space");
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) return <div className="p-6 text-center text-gray-500">Select a workspace first</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/spaces" className="p-1.5 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Space</h1>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Space Name *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, key: e.target.value.toUpperCase().replace(/\s+/g, "").substring(0, 5) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Engineering Docs" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Space Key *</label>
          <input type="text" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().substring(0, 10) })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono" placeholder="ENG" maxLength={10} required />
          <p className="mt-1 text-xs text-gray-400">Page URLs will look like: /spaces/{form.key || "KEY"}/page-slug</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" rows={3} placeholder="Brief description of the space" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "public", label: "Public", desc: "Anyone in the workspace can view", icon: Globe },
              { value: "private", label: "Private", desc: "Only selected members can view", icon: Lock },
            ].map((opt) => (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, type: opt.value as "public" | "private" })} className={`p-4 border-2 rounded-xl text-left transition-all ${form.type === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                <opt.icon className={`w-5 h-5 mb-2 ${form.type === opt.value ? "text-indigo-600" : "text-gray-400"}`} />
                <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/spaces" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
            {loading ? "Creating..." : "Create Space"}
          </button>
        </div>
      </form>
    </div>
  );
}
