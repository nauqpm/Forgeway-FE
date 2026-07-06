"use client";

import { ArrowLeft, Columns, Repeat } from "lucide-react";
import Link from "next/link";
import WorkspaceAvatarPicker from "@/modules/workspace/shared/components/WorkspaceAvatarPicker";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import type { CreateWorkspacePageProps } from "@/modules/workspace/shared/hooks/useCreateWorkspacePage";

export default function CreateWorkspaceView({
  form,
  handleFieldChange,
  handleKeyChange,
  handleSubmit,
  error,
  isLoading,
  avatarSamples,
  loadingAvatars,
}: CreateWorkspacePageProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="app-page-narrow py-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/workspaces" className="p-1.5 hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] rounded-[6px] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#787774] dark:text-[#9B9A97]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Create a new workspace</h1>
            <p className="text-[#787774] dark:text-[#9B9A97] text-sm mt-0.5">A workspace for your team</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] p-[var(--workspace-surface-pad)] md:p-[clamp(24px,2vw,32px)] space-y-8">
          {/* Basic Info */}
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] border border-[#F5C6C7] dark:border-[#9F2F2D]/30 rounded-[6px] text-sm text-[#9F2F2D] dark:text-[#F87171]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">Workspace Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  handleFieldChange("name", e.target.value);
                  handleFieldChange("key", e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").substring(0, 5));
                }}
                className="w-full px-4 py-3 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
                placeholder="Example: Engineering Team, Project Alpha"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">Workspace Key *</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] font-mono"
                placeholder="ENG"
                maxLength={10}
                required
              />
              <p className="mt-1.5 text-xs text-[#787774] dark:text-[#9B9A97]">
                The key is used to generate work item codes. Example: {
                  (() => {
                    const activeKey = form.key || "ENG";
                    return /-\d+$/.test(activeKey) ? activeKey : `${activeKey}-123`;
                  })()
                }.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">Short description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className="w-full px-4 py-3 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] resize-none"
                rows={3}
                placeholder="Describe the purpose of this workspace..."
              />
            </div>
          </div>

          <hr className="border-[#EAEAEA] dark:border-white/[0.06]" />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WorkspaceAvatar
                workspace={{ name: form.name || "Workspace", key: form.key, avatar: form.avatar }}
                size="lg"
              />
              <div>
                <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
                  Workspace avatar
                </label>
                <p className="text-xs text-[#787774] dark:text-[#9B9A97]">
                  Sample image library
                </p>
              </div>
            </div>
            <WorkspaceAvatarPicker
              avatars={avatarSamples}
              selectedAvatar={form.avatar}
              isLoading={loadingAvatars}
              onSelect={(avatar) => handleFieldChange("avatar", avatar)}
            />
          </div>

          <hr className="border-[#EAEAEA] dark:border-white/[0.06]" />

          {/* Workspace Type / Template */}
          <div>
            <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-3">Choose workspace type (template) *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleFieldChange("template", "kanban")}
                className={`workspace-panel border-2 rounded-[8px] text-left transition-all relative ${form.template === "kanban" ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]" : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"}`}
              >
                {form.template === "kanban" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] border-4 border-[#EFF6FF] dark:border-[#202020]" />}
                <Columns className={`w-8 h-8 mb-3 ${form.template === "kanban" ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                <h3 className="font-bold text-[#111111] dark:text-[#E8E8E7] mb-1">Kanban</h3>
                <p className="text-sm text-[#787774] dark:text-[#9B9A97] leading-relaxed">Focus on continuous workflow. Suitable for support, operations, or simple processes.</p>
              </button>

              <button
                type="button"
                onClick={() => handleFieldChange("template", "scrum")}
                className={`workspace-panel border-2 rounded-[8px] text-left transition-all relative ${form.template === "scrum" ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]" : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"}`}
              >
                {form.template === "scrum" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] border-4 border-[#EFF6FF] dark:border-[#202020]" />}
                <Repeat className={`w-8 h-8 mb-3 ${form.template === "scrum" ? "text-[#2563EB] dark:text-[#3B82F6]" : "text-[#ABABAB] dark:text-[#6B6B6B]"}`} />
                <h3 className="font-bold text-[#111111] dark:text-[#E8E8E7] mb-1">Scrum</h3>
                <p className="text-sm text-[#787774] dark:text-[#9B9A97] leading-relaxed">Work in recurring sprints with a dedicated backlog. Suitable for software development projects.</p>
              </button>
            </div>
          </div>

          <hr className="border-[#EAEAEA] dark:border-white/[0.06]" />

          {/* Visibility
          /*<div>
            <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7] mb-3">Access</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: "public", label: "Public in Workspace", desc: "Every member can view", icon: Globe },
                { value: "private", label: "Private (Private)", desc: "Only invited people can view", icon: Lock },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFieldChange("visibility", opt.value)}
                  className={`flex items-center gap-4 p-4 border rounded-[8px] text-left transition-all ${form.visibility === opt.value ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]" : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"}`}
                >
                  <div className={`p-2 rounded-[6px] ${form.visibility === opt.value ? "bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6]" : "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]"}`}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111111] dark:text-[#E8E8E7] text-sm">{opt.label}</p>
                    <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
           */}

          <div className="flex justify-end gap-3 pt-6 border-t border-[#EAEAEA] dark:border-white/[0.06]">
            <Link href="/workspaces" className="px-6 py-2.5 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] text-[#111111] dark:text-[#E8E8E7] hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] font-medium transition-colors">Cancel</Link>
            <button type="submit" disabled={isLoading} className="px-8 py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
              {isLoading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
