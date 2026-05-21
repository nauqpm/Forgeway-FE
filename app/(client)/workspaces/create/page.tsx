"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateWorkspace } from "@/modules/client/workspaces/hooks/useCreateWorkspace";
import { ArrowLeft, Columns, Repeat, Lock, Globe } from "lucide-react";
import Link from "next/link";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { createWorkspace, isLoading } = useCreateWorkspace();
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    visibility: "public" as "public" | "private",
    template: "kanban" as "kanban" | "scrum"
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createWorkspace({
        name: form.name,
        key: form.key,
        description: form.description,
        type: form.template,
        access: form.visibility === "public" ? "public" : "private",
      });
      router.push("/workspaces");
    } catch {
      setError("Tạo Workspace thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workspaces" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo không gian làm việc mới (Workspace)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Không gian làm việc cho team của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-8">
        {/* Basic Info */}
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Tên Workspace *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, key: e.target.value.toUpperCase().replace(/\s+/g, "").substring(0, 5) })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ví dụ: Đội Kỹ Thuật, Dự án Alpha"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Mã Workspace (Key) *</label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().substring(0, 10) })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              placeholder="ENG"
              maxLength={10}
              required
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Key dùng để tạo mã cho công việc. Ví dụ: {form.key || "ENG"}-123.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Mô tả ngắn</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
              placeholder="Mô tả mục đích của Workspace này..."
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Workspace Type / Template */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Chọn loại Workspace (Template) *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => setForm({ ...form, template: "kanban" })} 
              className={`p-5 border-2 rounded-xl text-left transition-all relative ${form.template === "kanban" ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
            >
              {form.template === "kanban" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-indigo-600 border-4 border-indigo-100" />}
              <Columns className={`w-8 h-8 mb-3 ${form.template === "kanban" ? "text-indigo-600" : "text-gray-400 dark:text-gray-500"}`} />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Kanban</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Tập trung vào luồng công việc liên tục. Phù hợp cho team support, vận hành, hoặc quy trình đơn giản.</p>
            </button>

            <button 
              type="button" 
              onClick={() => setForm({ ...form, template: "scrum" })} 
              className={`p-5 border-2 rounded-xl text-left transition-all relative ${form.template === "scrum" ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
            >
              {form.template === "scrum" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-indigo-600 border-4 border-indigo-100" />}
              <Repeat className={`w-8 h-8 mb-3 ${form.template === "scrum" ? "text-indigo-600" : "text-gray-400 dark:text-gray-500"}`} />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Scrum</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Làm việc theo các Sprint có chu kỳ. Có Backlog riêng. Phù hợp cho dự án phát triển phần mềm.</p>
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Quyền truy cập</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { value: "public", label: "Public trong Workspace", desc: "Mọi thành viên đều có thể xem", icon: Globe },
              { value: "private", label: "Private (Riêng tư)", desc: "Chỉ người được mời mới thấy", icon: Lock },
            ].map((opt) => (
              <button 
                key={opt.value} 
                type="button" 
                onClick={() => setForm({ ...form, visibility: opt.value as "public" | "private" })} 
                className={`flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${form.visibility === opt.value ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-600" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}
              >
                <div className={`p-2 rounded-lg ${form.visibility === opt.value ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <Link href="/workspaces" className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">Hủy</Link>
          <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {isLoading ? "Đang tạo..." : "Tạo Workspace"}
          </button>
        </div>
      </form>
    </div>
  );
}
