"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import LoadingSpinner from "@/modules/shared/components/common/components/LoadingSpinner";
import { Building2, Users, X, Crown, Shield, User } from "lucide-react";

interface Member {
  userId: { _id: string; email: string; fullName?: string };
  role: string;
}

export interface WorkspaceSettingsProps {
  className?: string;
}

export default function WorkspaceSettings({ className = "" }: WorkspaceSettingsProps) {
  const { currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(apiRoutes.WORKSPACES.BASE)
      .then((res) => {
        if (cancelled) return;
        setWorkspaces(res.data);
        const ws = currentWorkspace || (res.data.length > 0 ? res.data[0] : null);
        if (!ws) {
          setLoading(false);
          return;
        }
        return api.get(apiRoutes.WORKSPACES.BY_ID(ws._id));
      })
      .then((res) => {
        if (cancelled || !res) return;
        setWorkspace(res.data);
        setMembers(res.data.members || []);
        setForm({ name: res.data.name, description: res.data.description || "" });
      })
      .catch((err) => {
        console.error("Failed to fetch workspace settings:", err);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [setWorkspaces]);

  const handleSave = async () => {
    const workspaceId = currentWorkspace?._id ?? workspace?._id;
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await api.put(apiRoutes.WORKSPACES.UPDATE(workspaceId), form);
      setWorkspace(res.data);
      setCurrentWorkspace(res.data);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const workspaceId = currentWorkspace?._id ?? workspace?._id;
    if (!workspaceId) return;
    try {
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceId, userId));
      setMembers(members.filter((m) => m.userId._id !== userId));
    } catch {}
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleIcons: Record<string, any> = { owner: Crown, admin: Shield, member: User, viewer: User };
  const roleColors: Record<string, string> = {
    owner: "text-[#956400] dark:text-[#F59E0B]",
    admin: "text-[#1F6C9F] dark:text-[#93C5FD]",
    member: "text-[#2563EB] dark:text-[#3B82F6]",
    viewer: "text-[#ABABAB] dark:text-[#6B6B6B]",
  };
  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    member: "Member",
    viewer: "Viewer",
  };

  if (loading) return <LoadingSpinner />;

  if (!currentWorkspace)
    return (
      <div className={`p-6 text-center text-[#787774] dark:text-[#9B9A97] ${className}`}>
        No workspace found. Please create a workspace first.
      </div>
    );

  if (!workspace)
    return <div className={`p-6 text-center text-[#787774] dark:text-[#9B9A97] ${className}`}>Workspace not found</div>;

  return (
    <div className={`app-page-narrow ${className}`}>
      <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-6">Workspace Settings</h1>

      <div className="workspace-panel bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8 mb-6">
        <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> Workspace Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#787774] dark:text-[#9B9A97] mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#EAEAEA] dark:border-white/10 rounded-[6px] bg-white dark:bg-[#252525] text-[#111111] dark:text-[#E8E8E7] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2563EB] text-white rounded-[6px] hover:bg-[#1D4ED8] font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-panel bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/8">
        <h2 className="font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" /> Member ({members.length})
        </h2>
        <div className="space-y-2">
          {members.map((member) => {
            const RoleIcon = roleIcons[member.role] || User;
            return (
              <div
                key={member.userId._id}
                className="flex items-center justify-between p-3 bg-[#F9F9F8] dark:bg-[#252525] rounded-[6px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center text-sm font-bold">
                    {member.userId.fullName?.charAt(0) || member.userId.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111] dark:text-[#E8E8E7]">
                      {member.userId.fullName || "User"}
                    </p>
                    <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B]">{member.userId.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium capitalize flex items-center gap-1 ${roleColors[member.role]}`}>
                    <RoleIcon className="w-3.5 h-3.5" /> {roleLabels[member.role] || member.role}
                  </span>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(member.userId._id)}
                      className="p-1 hover:bg-[#FDEBEC] dark:hover:bg-[rgba(159,47,45,0.12)] rounded text-[#9F2F2D] dark:text-[#F87171]"
                      title="Remove from workspace"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
