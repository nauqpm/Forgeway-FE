"use client";

import { FormEvent, KeyboardEvent } from "react";
import { Globe, Loader2, Lock, Save } from "lucide-react";

import {
  WorkspaceInfo,
  WorkspaceSettingsForm,
  WorkspaceAccess,
  WorkspaceStatus,
} from "../types/workspaceSettings.type";
import DangerZone from "./DangerZone";

export interface GeneralSettingsProps {
  form: WorkspaceSettingsForm;
  workspace: WorkspaceInfo;
  saving: boolean;
  canManageWorkspace: boolean;
  setForm: (form: WorkspaceSettingsForm) => void;
  handleSave: (event: FormEvent) => void;
  // DangerZone passthrough props
  showDeleteDialog: boolean;
  setShowDeleteDialog: (value: boolean) => void;
  deleteConfirm: string;
  setDeleteConfirm: (value: string) => void;
  deleting: boolean;
  handleDelete: () => void;
  showLeaveDialog: boolean;
  setShowLeaveDialog: (value: boolean) => void;
  leaveConfirm: string;
  setLeaveConfirm: (value: string) => void;
  leaving: boolean;
  handleLeave: () => void;
  handleDeleteConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleLeaveConfirmKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export default function GeneralSettings({
  form,
  workspace,
  saving,
  canManageWorkspace,
  setForm,
  handleSave,
  showDeleteDialog,
  setShowDeleteDialog,
  deleteConfirm,
  setDeleteConfirm,
  deleting,
  handleDelete,
  showLeaveDialog,
  setShowLeaveDialog,
  leaveConfirm,
  setLeaveConfirm,
  leaving,
  handleLeave,
  handleDeleteConfirmKeyDown,
  handleLeaveConfirmKeyDown,
}: GeneralSettingsProps) {
  return (
    <form onSubmit={handleSave} className="space-y-8 w-full max-w-full">
      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">Basic information</h2>
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { value: "public", label: "Public", icon: Globe },
            { value: "private", label: "Private", icon: Lock },
          ] as const).map((option) => (
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
                onChange={() => setForm({ ...form, access: option.value as WorkspaceAccess })}
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <div className="flex items-center gap-2">
                <option.icon className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
                <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">{option.label}</span>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ] as const).map((option) => (
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
                onChange={() => setForm({ ...form, status: option.value as WorkspaceStatus })}
                disabled={!canManageWorkspace}
                className="text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7] mb-4">Settings</h2>
        <div className="flex items-center justify-between p-4 bg-[#F9F9F8] dark:bg-[#252525] rounded-[6px] border border-[#EAEAEA] dark:border-white/[0.06]">
          <div>
            <label className="block text-sm font-semibold text-[#111111] dark:text-[#E8E8E7]">
              Important Mode
            </label>
            <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5">
              Mark this workspace as highly important. It will be highlighted with a gold theme and star icon in the sidebar.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.settings?.isImportant ?? false}
              onChange={(e) =>
                setForm({
                  ...form,
                  settings: {
                    ...form.settings,
                    isImportant: e.target.checked,
                  },
                })
              }
              disabled={!canManageWorkspace}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 dark:peer-checked:bg-amber-500"></div>
          </label>
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

      <DangerZone
        workspace={workspace}
        canManageWorkspace={canManageWorkspace}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        deleting={deleting}
        handleDelete={handleDelete}
        showLeaveDialog={showLeaveDialog}
        setShowLeaveDialog={setShowLeaveDialog}
        leaveConfirm={leaveConfirm}
        setLeaveConfirm={setLeaveConfirm}
        leaving={leaving}
        handleLeave={handleLeave}
        handleDeleteConfirmKeyDown={handleDeleteConfirmKeyDown}
        handleLeaveConfirmKeyDown={handleLeaveConfirmKeyDown}
      />
    </form>
  );
}
