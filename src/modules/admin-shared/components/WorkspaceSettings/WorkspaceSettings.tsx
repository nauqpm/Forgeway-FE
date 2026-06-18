"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Users, X, Crown, Shield, User } from "lucide-react";
import api from "@/lib/axiosIns";
import { apiRoutes } from "@/config/apiRoutes";
import { queryKeys } from "@/shared/constants/queryKeys";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import type { Workspace } from "@/stores/workspaceStore";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";
import { workspaceService } from "@/modules/workspace/shared/services/workspaceService";

interface Member {
  userId: { _id: string; email: string; fullName?: string };
  role: string;
}

interface WorkspaceDetail extends Workspace {
  description?: string;
}

export interface WorkspaceSettingsProps {
  className?: string;
}

export default function WorkspaceSettings({ className = "" }: WorkspaceSettingsProps) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useCurrentWorkspace();
  const [form, setForm] = useState({ name: "", description: "" });

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: queryKeys.workspaces.list(),
    queryFn: workspaceService.listMine,
  });

  const activeWorkspace = currentWorkspace ?? workspacesQuery.data?.[0] ?? null;

  const workspaceQuery = useQuery<WorkspaceDetail>({
    queryKey: activeWorkspace ? queryKeys.admin.settings(activeWorkspace._id) : [...queryKeys.admin.all, "settings", "none"],
    queryFn: async () => {
      const res = await api.get(apiRoutes.WORKSPACES.BY_ID(activeWorkspace!._id));
      return res.data;
    },
    enabled: !!activeWorkspace?._id,
  });

  useEffect(() => {
    if (workspaceQuery.data) {
      setForm({
        name: workspaceQuery.data.name,
        description: workspaceQuery.data.description || "",
      });
    }
  }, [workspaceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const workspaceId = activeWorkspace?._id ?? workspaceQuery.data?._id;
      if (!workspaceId) return null;
      const res = await api.put(apiRoutes.WORKSPACES.UPDATE(workspaceId), form);
      return res.data as WorkspaceDetail;
    },
    onSuccess: (updatedWorkspace) => {
      if (!updatedWorkspace) return;
      queryClient.setQueryData(queryKeys.admin.settings(updatedWorkspace._id), updatedWorkspace);
      queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (current = []) =>
        current.map((workspace) =>
          workspace._id === updatedWorkspace._id ? { ...workspace, ...updatedWorkspace } : workspace,
        ),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.list() });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const workspaceId = activeWorkspace?._id ?? workspaceQuery.data?._id;
      if (!workspaceId) return null;
      await api.delete(apiRoutes.WORKSPACES.REMOVE_MEMBER(workspaceId, userId));
      return userId;
    },
    onSuccess: (userId) => {
      if (!userId || !workspaceQuery.data?._id) return;
      queryClient.setQueryData<WorkspaceDetail>(queryKeys.admin.settings(workspaceQuery.data._id), (current) =>
        current
          ? {
              ...current,
              members: (current.members ?? []).filter((member) => {
                const memberId =
                  typeof member.userId === "string"
                    ? member.userId
                    : member.userId?._id ?? member.userId?.id ?? "";
                return memberId !== userId;
              }),
            }
          : current,
      );
    },
  });

  const workspace = workspaceQuery.data ?? null;
  const members = (workspace?.members ?? []) as Member[];

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

  if (workspacesQuery.isLoading || workspaceQuery.isLoading) return <LoadingSpinner />;

  if (!activeWorkspace)
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
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-[#2563EB] text-white rounded-[6px] hover:bg-[#1D4ED8] font-medium disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save changes"}
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
                      onClick={() => removeMemberMutation.mutate(member.userId._id)}
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
