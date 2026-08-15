"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import type { DashboardTask } from "@/modules/admin-shared/types/dashboard.types";

interface Props {
  assignedTasks: DashboardTask[];
  completedCount: number;
  workspaceCount: number;
  onOpenTask: (task: DashboardTask) => void;
  title?: string;
  showAllHref?: string;
  showSort?: boolean;
}

type TaskSort = "name" | "newest";

export function DashboardTaskList({ assignedTasks, completedCount, workspaceCount, onOpenTask, title = "For you", showAllHref, showSort = false }: Props) {
  const [sortBy, setSortBy] = useState<TaskSort>("newest");
  const visibleTasks = useMemo(() => {
    if (!showSort) return assignedTasks;
    return [...assignedTasks].sort((left, right) => {
      if (sortBy === "name") {
        return left.title.localeCompare(right.title, undefined, { sensitivity: "base" });
      }
      const leftDate = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
      const rightDate = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
      return rightDate - leftDate;
    });
  }, [assignedTasks, showSort, sortBy]);

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

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-[0.6875rem] sm:text-xs text-[#787774] dark:text-[#9B9A97] truncate">Assigned tasks</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{assignedTasks.length}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-[0.6875rem] sm:text-xs text-[#787774] dark:text-[#9B9A97] truncate">Recently completed</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{completedCount}</p>
        </div>
        <div className="rounded-[8px] border border-[#EAEAEA] bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 dark:border-white/[0.06] dark:bg-[#202020]">
          <p className="text-[0.6875rem] sm:text-xs text-[#787774] dark:text-[#9B9A97] truncate">Recommended workspaces</p>
          <p className="mt-1 text-lg sm:text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">{workspaceCount}</p>
        </div>
      </div>

      {showSort && assignedTasks.length > 0 && (
        <div className="mb-4 flex justify-end">
          <label className="flex items-center gap-2 text-sm text-[#787774] dark:text-[#9B9A97]">
            Sort tasks by
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as TaskSort)}
              className="rounded-[6px] border border-[#EAEAEA] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:border-[#2563EB] dark:border-white/[0.08] dark:bg-[#202020] dark:text-[#E8E8E7]"
            >
              <option value="newest">Newest updated</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
      )}

      <div className="max-h-[320px] space-y-2 overflow-y-auto overscroll-contain pb-1 pr-1">
        {assignedTasks.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#EAEAEA] bg-[#F9F9F8] px-4 py-8 text-center text-sm text-[#787774] dark:border-white/[0.06] dark:bg-[#252525] dark:text-[#9B9A97]">
            No tasks assigned to you yet.
          </div>
        ) : (
          visibleTasks.map((task) => (
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
