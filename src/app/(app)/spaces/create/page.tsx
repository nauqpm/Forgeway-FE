"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { ArrowLeft, Columns, Repeat, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default function CreateSpacePage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();
  const [form, setForm] = useState({ 
    name: "", 
    key: "", 
    description: "", 
    visibility: "public" as "public" | "private",
    template: "kanban" as "kanban" | "scrum"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    setLoading(true);
    setError("");
    
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newSpace = {
        _id: "space_" + Date.now(),
        ...form,
        workspaceId: currentWorkspace._id,
        createdAt: new Date().toISOString(),
        _count: { pages: 0, issues: 0 }
      };

      // Get existing mock spaces
      const existing = JSON.parse(localStorage.getItem("MOCK_SPACES") || "[]");
      localStorage.setItem("MOCK_SPACES", JSON.stringify([...existing, newSpace]));

      router.push(`/spaces`); // Temporarily route to list since detail page is not ready
    } catch (e: any) {
      setError("Failed to create space");
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) return <div className="p-6 text-center text-gray-500">Select a workspace first</div>;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/spaces" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Tạo không gian làm việc mới (Space)</h1>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 space-y-8">
        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tên Space *</label>
            <input 
              type="text" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value, key: e.target.value.toUpperCase().replace(/\s+/g, "").substring(0, 5) })} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="Ví dụ: Đội Kỹ Thuật, Dự án Alpha" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Mã Space (Key) *</label>
            <input 
              type="text" 
              value={form.key} 
              onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().substring(0, 10) })} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono" 
              placeholder="ENG" 
              maxLength={10} 
              required 
            />
            <p className="mt-1.5 text-xs text-gray-500">Key dùng để tạo mã cho công việc. Ví dụ: {form.key || "ENG"}-123.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Mô tả ngắn</label>
            <textarea 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" 
              rows={3} 
              placeholder="Mô tả mục đích của Space này..." 
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Space Type / Template */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Chọn loại Space (Template) *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => setForm({ ...form, template: "kanban" })} 
              className={`p-5 border-2 rounded-xl text-left transition-all relative ${form.template === "kanban" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              {form.template === "kanban" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-indigo-600 border-4 border-indigo-100" />}
              <Columns className={`w-8 h-8 mb-3 ${form.template === "kanban" ? "text-indigo-600" : "text-gray-400"}`} />
              <h3 className="font-bold text-gray-900 mb-1">Kanban</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Tập trung vào luồng công việc liên tục. Phù hợp cho team support, vận hành, hoặc quy trình đơn giản.</p>
            </button>

            <button 
              type="button" 
              onClick={() => setForm({ ...form, template: "scrum" })} 
              className={`p-5 border-2 rounded-xl text-left transition-all relative ${form.template === "scrum" ? "border-indigo-600 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300"}`}
            >
              {form.template === "scrum" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-indigo-600 border-4 border-indigo-100" />}
              <Repeat className={`w-8 h-8 mb-3 ${form.template === "scrum" ? "text-indigo-600" : "text-gray-400"}`} />
              <h3 className="font-bold text-gray-900 mb-1">Scrum</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Làm việc theo các Sprint có chu kỳ. Có Backlog riêng. Phù hợp cho dự án phát triển phần mềm.</p>
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Quyền truy cập</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { value: "public", label: "Public trong Workspace", desc: "Mọi thành viên đều có thể xem", icon: Globe },
              { value: "private", label: "Private (Riêng tư)", desc: "Chỉ người được mời mới thấy", icon: Lock },
            ].map((opt) => (
              <button 
                key={opt.value} 
                type="button" 
                onClick={() => setForm({ ...form, visibility: opt.value as "public" | "private" })} 
                className={`flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${form.visibility === opt.value ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className={`p-2 rounded-lg ${form.visibility === opt.value ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Link href="/spaces" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Hủy</Link>
          <button type="submit" disabled={loading} className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? "Đang tạo..." : "Tạo Space"}
          </button>
        </div>
      </form>
    </div>
  );
}
