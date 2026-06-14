"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import { Loader2, Save, Globe, Lock, ShieldAlert, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";

interface WorkspaceSettingsForm {
  name: string;
  description: string;
  status: "active" | "archived";
  access: "public" | "private";
}

interface WorkspaceSettings {
  _id: string;
  name: string;
  key: string;
}

interface GeneralSettingsProps {
  form: WorkspaceSettingsForm;
  workspace: WorkspaceSettings;
  saving: boolean;
  canManageWorkspace: boolean;
  setForm: (form: WorkspaceSettingsForm) => void;
  handleSave: (event: FormEvent) => void;
  setShowDeleteDialog: (value: boolean) => void;
  setShowLeaveDialog: (value: boolean) => void;
}

export default function GeneralSettings({
  form,
  workspace,
  saving,
  canManageWorkspace,
  setForm,
  handleSave,
  setShowDeleteDialog,
  setShowLeaveDialog,
}: GeneralSettingsProps) {
  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-[min(100%,42rem)]">
      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Basic information
        </h2>
        {!canManageWorkspace && (
          <p className="mb-4 rounded-[6px] border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            You can view workspace information. Only administrators can edit it.
          </p>
        )}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Workspace name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              disabled={!canManageWorkspace}
              className="w-full px-4 py-2 border border-[#EAEAEA] dark:border-white/[0.08] rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-1.5">
              Workspace key
            </label>
            <input
              type="text"
              value={workspace.key}
              disabled
              className="w-full px-4 py-2 bg-[#F9F9F8] dark:bg-[#252525] border border-[#EAEAEA] dark:border-white/[0.06] rounded-[6px] text-[#787774] dark:text-[#9B9A97] font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      <hr className="border-[#EAEAEA] dark:border-white/[0.06]" />

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "public", label: "Public", icon: Globe },
            { value: "private", label: "Private", icon: Lock },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.access === option.value
                  ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
                  : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"
              }`}
            >
              <input
                type="radio"
                name="access"
                value={option.value}
                checked={form.access === option.value}
                onChange={() =>
                  setForm({ ...form, access: option.value as "public" | "private" })
                }
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <div className="flex items-center gap-2">
                <option.icon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
                <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                  {option.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">
          Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                form.status === option.value
                  ? "border-[#2563EB] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
                  : "border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={form.status === option.value}
                onChange={() =>
                  setForm({ ...form, status: option.value as "active" | "archived" })
                }
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {canManageWorkspace && (
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-sm font-medium hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </div>
      )}

      <section className="mt-12 p-5 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-6">
        <h3 className="text-red-800 dark:text-red-200 font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> Danger zone
        </h3>

        <div className="pb-6 border-b border-red-200 dark:border-red-800">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Leave workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 mb-3">
            {canManageWorkspace
              ? "You are the workspace owner. You must delete the workspace before leaving."
              : "You will lose access to this workspace."}
          </p>
          <button
            type="button"
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-[6px] text-sm font-semibold transition-colors shadow-sm shadow-amber-600/20"
          >
            <LogOut className="w-4 h-4" />
            Leave workspace
          </button>
        </div>

        {canManageWorkspace && (
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
              Delete workspace
            </p>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              Delete this workspace along with its boards, backlog, and related
              content. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 bg-[#9F2F2D] text-white hover:bg-[#8F2927] rounded-[6px] text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-[#9F2F2D]/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete workspace
            </button>
          </div>
        )}
      </section>
    </form>
  );
}
