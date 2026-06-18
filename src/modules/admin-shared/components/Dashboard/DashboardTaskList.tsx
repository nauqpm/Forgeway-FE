"use client";

import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { DashboardTask } from "@/modules/admin-shared/types/dashboard.types";

interface Props {
  assignedTasks: DashboardTask[];
  completedCount: number;
  workspaceCount: number;
  onOpenTask: (task: DashboardTask) => void;
  title?: string;
  showAllHref?: string;
}

export function DashboardTaskList({ assignedTasks, completedCount, workspaceCount, onOpenTask, title = "For you", showAllHref }: Props) {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111111] dark:text-[#E8E8E7]">{title}</h2>
        {showAllHref && (
          <Link href={showAllHref} className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]">
            View all for you items
          </Link>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Assigned tasks</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{assignedTasks.length}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recently completed</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{completedCount}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-xs text-[#787774] dark:text-[#9B9A97]">Recommended workspaces</p>
          <p className="mt-1 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{workspaceCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        {assignedTasks.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] px-4 py-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            No tasks assigned to you yet.
          </div>
        ) : (
          assignedTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onOpenTask(task)}
              className="flex cursor-pointer items-center justify-between rounded-[8px] border border-[#EAEAEA] bg-[#F9F9F8] px-4 py-3 transition hover:bg-[#F7F6F3] dark:border-white/[0.06] dark:bg-[#202020] dark:hover:bg-white/8"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[4px] bg-[#EDF3EC] dark:bg-[rgba(52,101,56,0.12)]">
                  {task.type === "worked" ? (
                    <CheckCircle2 className="h-4 w-4 text-[#346538] dark:text-[#4ADE80]" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-[#346538] dark:text-[#4ADE80]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#111111] dark:text-[#E8E8E7]">{task.title}</p>
                  <p className="truncate text-xs text-[#787774] dark:text-[#9B9A97]">{task.meta}</p>
                </div>
              </div>
              <span className="ml-3 rounded-[4px] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1F6C9F] dark:bg-[rgba(37,99,235,0.12)] dark:text-[#93C5FD]">
                Open
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
