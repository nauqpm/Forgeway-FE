"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, ArrowRight, LayoutDashboard, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
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

const WORKSPACES_PER_PAGE = 10;
type WorkspaceSort = "name" | "newest";

export function ForYouWorkspaceGrid({ workspaces, stats, error }: Props) {
  const [sortBy, setSortBy] = useState<WorkspaceSort>("name");
  const [page, setPage] = useState(1);

  const sortedWorkspaces = useMemo(() => {
    return [...workspaces].sort((left, right) => {
      if (sortBy === "newest") {
        const dateDifference = new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime();
        if (dateDifference !== 0) return dateDifference;
      }
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
    });
  }, [sortBy, workspaces]);

  const totalPages = Math.max(1, Math.ceil(sortedWorkspaces.length / WORKSPACES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * WORKSPACES_PER_PAGE;
  const visibleWorkspaces = sortedWorkspaces.slice(pageStart, pageStart + WORKSPACES_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

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

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-2.5 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] truncate">Owned</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.owned}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-2.5 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] truncate">Joined</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.joined}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#202020] px-2.5 py-2.5 sm:px-4 sm:py-3">
          <p className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97] truncate">Active</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{stats.active}</p>
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
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#787774] dark:text-[#9B9A97]">
              Showing {pageStart + 1}–{Math.min(pageStart + WORKSPACES_PER_PAGE, sortedWorkspaces.length)} of {sortedWorkspaces.length}
            </p>
            <label className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#9B9A97]">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as WorkspaceSort)}
                className="rounded-[6px] border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:border-[#2563EB] dark:border-white/[0.08] dark:bg-[#202020] dark:text-[#E8E8E7]"
              >
                <option value="name">Name A–Z</option>
                <option value="newest">Newest updated</option>
              </select>
            </label>
          </div>

          <div className="app-card-grid-fluid-xl grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleWorkspaces.map((workspace) => {
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 items-center gap-1 rounded-[6px] border border-[#EAEAEA] bg-white px-3 text-sm text-[#111111] transition hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#202020] dark:text-[#E8E8E7] dark:hover:bg-white/[0.05]"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-[#787774] dark:text-[#9B9A97]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-[6px] border border-[#EAEAEA] bg-white px-3 text-sm text-[#111111] transition hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#202020] dark:text-[#E8E8E7] dark:hover:bg-white/[0.05]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
