"use client";

import Link from "next/link";
import WorkspaceAvatar from "@/modules/workspace/shared/components/WorkspaceAvatar";
import type { DashboardWorkspaceCard } from "@/modules/admin-shared/types/dashboard.types";

interface Props {
  workspaces: DashboardWorkspaceCard[];
}

export function DashboardWorkspaceGrid({ workspaces }: Props) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="px-2 text-2xl font-bold text-[#111111] dark:text-[#E8E8E7]">Recommended workspaces</h1>
        <Link href="/workspaces" className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workspaces.length === 0 ? (
          <div className="col-span-full rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] p-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            No recommended workspaces yet.
          </div>
        ) : (
          workspaces.map((workspace) => (
            <Link
              key={workspace.id ?? workspace.routeKey}
              href={`/workspaces/${workspace.routeKey}`}
              className="workspace-panel group rounded-[8px] border border-[#EAEAEA] bg-white transition-all hover:border-[#2563EB]/20 dark:border-white/[0.06] dark:bg-[#202020] dark:hover:border-[#3B82F6]"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start gap-4">
                <WorkspaceAvatar workspace={workspace} size="lg" />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#111111] group-hover:text-[#2563EB] dark:text-[#E8E8E7] dark:group-hover:text-[#3B82F6]">
                    {workspace.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-[#787774] dark:text-[#9B9A97]">{workspace.description}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
