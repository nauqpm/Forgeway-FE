"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import Link from "next/link";
import { BookOpen, Plus, Globe, Lock, ChevronRight, Columns, Repeat } from "lucide-react";
import type { Workspace } from "@/modules/workspace/shared/types/workspace.type";
import { realtimeSocketClient } from "@/lib/socket/socket.client";
import { SOCKET_EVENTS } from "@/lib/socket/socket.events";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import { queryKeys } from "@/shared/constants/queryKeys";
import { useCurrentWorkspace } from "@/modules/workspace/shared/hooks/useWorkspaces";

const getWorkspaceType = (workspace: Workspace) =>
  workspace.template ?? workspace.type ?? "kanban";

const getWorkspaceTaskCount = (workspace: Workspace) =>
  workspace._count?.tasks ??
  workspace._count?.issues ??
  workspace.taskCount ??
  workspace.tasksCount ??
  workspace.issueCount ??
  workspace.issuesCount ??
  0;

const getWorkspaceDocsCount = (workspace: Workspace) =>
  workspace._count?.docs ??
  workspace._count?.pages ??
  workspace.docsCount ??
  0;

const getWorkspaceStatus = (workspace: Workspace) => {
  const status = workspace.status?.toLowerCase();
  if (workspace.isArchived || workspace.archivedAt || status === "archived") return "archived";
  return "active";
};

const getStatusClassName = (status: "active" | "archived") =>
  status === "active"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60"
    : "bg-[#F7F6F3] text-[#787774] ring-[#EAEAEA] dark:bg-[#252525] dark:text-[#9B9A97] dark:ring-white/[0.06]";

export default function WorkspacesPage() {
  usePageTitle('Workspaces');
  const queryClient = useQueryClient();
  const { currentWorkspace, workspaces, isLoading } = useCurrentWorkspace();

  useEffect(() => {
    const socket = realtimeSocketClient.getSocket();
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWorkspaceCreated = (payload: any) => {
      if (payload.type === SOCKET_EVENTS.WORKSPACE_CREATED) {
        const newWorkspace = payload.data?.workspace;
        if (newWorkspace) {
          queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (prev = []) => {
            // Avoid duplicates
            if (prev.some((w) => w._id === newWorkspace.id || w._id === newWorkspace._id)) return prev;
            // The event payload has id instead of _id, we normalize it
            const normalizedWorkspace = { ...newWorkspace, _id: newWorkspace.id } as Workspace;
            return [normalizedWorkspace, ...prev];
          });
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWorkspaceDeleted = (payload: any) => {
      const workspaceId = payload.data?.workspaceId ?? payload.workspaceId;
      if (workspaceId) {
        queryClient.setQueryData<Workspace[]>(queryKeys.workspaces.list(), (prev = []) =>
          prev.filter((w) => w._id !== workspaceId),
        );
      }
    };

    socket.on(SOCKET_EVENTS.WORKSPACE_CREATED, handleWorkspaceCreated);
    socket.on(SOCKET_EVENTS.WORKSPACE_DELETED, handleWorkspaceDeleted);

    return () => {
      socket.off(SOCKET_EVENTS.WORKSPACE_CREATED, handleWorkspaceCreated);
      socket.off(SOCKET_EVENTS.WORKSPACE_DELETED, handleWorkspaceDeleted);
    };
  }, [queryClient]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex-1 overflow-y-auto p-[var(--app-page-pad)]">
      <div className="app-page-wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-1">Workspaces</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] text-sm">Showing {workspaces.length} Workspace{workspaces.length !== 1 ? 's' : ''}{currentWorkspace ? ` (Current: ${currentWorkspace.name})` : ''}</p>
        </div>
        <Link href="/workspaces/create" className="inline-flex items-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white px-5 py-2.5 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] font-medium text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Create New Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] border-dashed">
          <div className="w-16 h-16 bg-[#F7F6F3] dark:bg-[#252525] rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-[#ABABAB] dark:text-[#6B6B6B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7] mb-2">No workspaces yet</h3>
          <p className="text-[#787774] dark:text-[#9B9A97] text-sm mb-6 max-w-sm text-center">Create a new workspace to start organizing work, storing documents, and managing projects for your team.</p>
          <Link href="/workspaces/create" className="inline-flex items-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white px-5 py-2.5 rounded-[6px] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] font-medium text-sm shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((workspace) => {
            const workspaceType = getWorkspaceType(workspace);
            const workspaceStatus = getWorkspaceStatus(workspace);
            const taskCount = getWorkspaceTaskCount(workspace);
            const docsCount = getWorkspaceDocsCount(workspace);
            const routeKey = workspace.key || workspace.slug || workspace._id;

            return (
              <Link key={workspace._id} href={`/workspaces/${routeKey}`} className="workspace-panel group bg-white dark:bg-[#202020] rounded-[8px] border border-[#EAEAEA] dark:border-white/[0.06] hover:border-[#2563EB]/30 dark:hover:border-[#3B82F6]/40 transition-all flex flex-col h-full cursor-pointer">

                {/* Header Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3 items-center">
                    <WorkspaceAvatar workspace={workspace} size="lg" className="shadow-inner" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {workspace.access === "public" ? (
                          <Globe className="w-3.5 h-3.5 text-[#ABABAB] dark:text-[#6B6B6B]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="px-1.5 py-0.5 bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97] rounded text-[0.625rem] font-mono font-bold tracking-wider">{workspace.key || routeKey}</span>
                      </div>
                      <h3 className="font-bold text-[#111111] dark:text-[#E8E8E7] text-lg group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors line-clamp-1">{workspace.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#EFF6FF] px-2 py-0.5 text-xs font-semibold capitalize text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
                          {workspaceType === "scrum" ? (
                            <Repeat className="mr-1 inline h-3 w-3" />
                          ) : (
                            <Columns className="mr-1 inline h-3 w-3" />
                          )}
                          {workspaceType}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClassName(workspaceStatus)}`}>
                          {workspaceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Footer Metrics */}
                <div className="flex items-center justify-between pt-4 border-t border-[#EAEAEA] dark:border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#787774] dark:text-[#9B9A97]">Tasks</span>
                      <span className="text-xs font-semibold text-[#111111] dark:text-[#E8E8E7]">{taskCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#787774] dark:text-[#9B9A97]">Docs</span>
                      <span className="text-xs font-semibold text-[#111111] dark:text-[#E8E8E7]">{docsCount}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F7F6F3] dark:bg-[#252525] flex items-center justify-center group-hover:bg-[#EFF6FF] dark:group-hover:bg-[rgba(37,99,235,0.12)] transition-colors">
                    <ChevronRight className="w-4 h-4 text-[#ABABAB] dark:text-[#6B6B6B] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]" />
                  </div>
                </div>

              </Link>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
