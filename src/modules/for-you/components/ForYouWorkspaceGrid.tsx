"use client";

import Link from "next/link";
import { Plus, ArrowRight, LayoutDashboard, BookOpen } from "lucide-react";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import type { ForYouWorkspace } from "@/modules/admin-shared/types/dashboard.types";
import { workspaceIdOf, workspaceRouteKeyOf } from "@/modules/admin-shared/utils/dashboard.utils";

const roleLabel = (workspace: ForYouWorkspace) =>
  workspace.ownershipLabel || workspace.relationship || workspace.role?.replace(/_/g, " ") || "Workspace";

interface Stats {
  owned: number;
  joined: number;
  active: number;
}

interface Props {
  workspaces: ForYouWorkspace[];
  stats: Stats;
  error: unknown;
}

export function ForYouWorkspaceGrid({ workspaces, stats, error }: Props) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-1">For You</h1>
          <p className="text-sm text-[#787774] dark:text-[#9B9A97]">
            Showing {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/workspaces/create"
          className="inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create New Workspace
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">Owned</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.owned}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">Joined</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.joined}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-4 py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">Active</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.active}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[6px] border border-[#F5C6C7] dark:border-[rgba(159,47,45,0.2)] bg-[#FDEBEC] dark:bg-[rgba(159,47,45,0.12)] px-4 py-3 text-[0.8125rem] text-[#9F2F2D] dark:text-[#F87171]">
          Could not load your workspace recommendations.
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-[0.9375rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">No workspace yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[0.8125rem] text-[#787774] dark:text-[#9B9A97]">
            Create a workspace to start organizing work, documents, and team collaboration.
          </p>
          <Link
            href="/workspaces/create"
            className="mt-6 inline-flex items-center gap-2 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
          >
            <Plus className="h-4 w-4" />
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {workspaces.map((workspace) => {
            const routeKey = workspaceRouteKeyOf(workspace);
            return (
              <Link
                key={workspaceIdOf(workspace) || routeKey}
                href={`/workspaces/${routeKey}`}
                className="group rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] p-5 transition hover:border-[#2563EB]/30 dark:hover:border-[rgba(59,130,246,0.12)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <WorkspaceAvatar workspace={workspace} size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <h3 className="truncate text-[0.8125rem] font-semibold text-[#111111] dark:text-[#E8E8E7] group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
                        {workspace.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {workspace.key && (
                          <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-0.5 text-[0.625rem] font-mono font-semibold text-[#787774] dark:text-[#9B9A97]">
                            {workspace.key}
                          </span>
                        )}
                        <span className="rounded-[4px] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-2 py-0.5 text-[0.625rem] font-medium capitalize text-[#1F6C9F] dark:text-[#93C5FD]">
                          {roleLabel(workspace)}
                        </span>
                        {workspace.status && (
                          <span className="rounded-[4px] bg-[#F7F6F3] dark:bg-[#252525] px-2 py-0.5 text-[0.625rem] font-medium capitalize text-[#787774] dark:text-[#9B9A97]">
                            {workspace.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#ABABAB] dark:text-[#6B6B6B] transition group-hover:translate-x-0.5 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]" />
                </div>
                <div className="mt-5 flex items-center gap-2 text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
                  <LayoutDashboard className="h-4 w-4" />
                  Open workspace
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
