"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/common/services/api.service";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/app/common/components/LoadingSpinner";
import { ArrowLeft, ArrowRight, Save, Eye, Plus } from "lucide-react";
import Link from "next/link";

interface Page {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  status: string;
  labels: string[];
  spaceId: string;
}

export default function CreatePagePage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", labels: "", status: "published" as "draft" | "published" });
  const [labelInput, setLabelInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const labels = form.labels.split(",").map(l => l.trim()).filter(Boolean);
      const res = await api.post(apiRoutes.PAGES.BASE, {
        title: form.title,
        content: form.content,
        spaceId,
        status: form.status,
        labels,
      });
      router.push(`/spaces/${spaceId}/pages/${res.data.slug}`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addLabel = () => {
    if (!labelInput.trim()) return;
    const current = form.labels.split(",").map(l => l.trim()).filter(Boolean);
    if (!current.includes(labelInput.trim())) {
      setForm({ ...form, labels: [...current, labelInput.trim()].join(", ") });
    }
    setLabelInput("");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/spaces/${spaceId}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Page</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create a new document in this space</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
              placeholder="Enter page title"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12}
              placeholder="Write your content here... (Markdown supported)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Labels</label>
            <div className="flex gap-2">
              <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                placeholder="Type a label and press Enter"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              <button type="button" onClick={addLabel}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.labels && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.labels.split(",").map(l => l.trim()).filter(Boolean).map(label => (
                  <span key={label} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                    {label}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Separate multiple labels with commas</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <div className="flex gap-3">
              {(["draft", "published"] as const).map(s => (
                <label key={s} className={`flex-1 flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${form.status === s ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="status" value={s} checked={form.status === s}
                    onChange={() => setForm({ ...form, status: s })} />
                  <span className="text-sm font-medium text-gray-800 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link href={`/spaces/${spaceId}`} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={loading || !form.title.trim()}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? "Creating..." : <><Save className="w-4 h-4" /> Create Page</>}
          </button>
        </div>
      </form>
    </div>
  );
}
