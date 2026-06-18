"use client";

import { Loader2 } from "lucide-react";
import TaskDetailModal from "@/modules/workspace/tasks/detail/TaskDetailModal";
import type { Sprint } from "@/modules/workspace/shared/types/sprint.type";
import type { BoardColumn } from "@/modules/workspace/shared/types/board.type";
import type { DashboardTask, ForYouWorkspace } from "@/modules/admin-shared/types/dashboard.types";
import { workspaceIdOf, workspaceRouteKeyOf } from "@/modules/admin-shared/utils/dashboard.utils";

interface Props {
  isOpen: boolean;
  isLoading: boolean;
  selectedTask: DashboardTask | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taskDetail: any;
  boardColumns: BoardColumn[];
  sprints: Sprint[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workspaceMembers: any[];
  workspaces: ForYouWorkspace[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (issue: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onArchive: (issue: any) => Promise<void>;
}

export function DashboardTaskModal({
  isOpen, isLoading, selectedTask, taskDetail,
  boardColumns, sprints, workspaceMembers, workspaces,
  onClose, onUpdate, onArchive,
}: Props) {
  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 md:p-8 animate-in fade-in duration-200">
        <div className="flex flex-col items-center justify-center bg-white dark:bg-[#202020] rounded-[10px] p-8 shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] dark:text-[#3B82F6] mb-4" />
          <p className="text-[#111111] dark:text-[#E8E8E7] font-medium">Loading task...</p>
        </div>
      </div>
    );
  }

  if (!taskDetail || !selectedTask) return null;

  const ws = workspaces.find(w => workspaceRouteKeyOf(w) === selectedTask.workspaceKey);
  const wsId = ws ? workspaceIdOf(ws) : "";

  return (
    <TaskDetailModal
      issue={taskDetail}
      workspaceId={wsId}
      boardColumns={boardColumns}
      sprints={sprints}
      workspaceMembers={workspaceMembers}
      workspaceTemplate={ws?.type === "scrum" ? "scrum" : "kanban"}
      onClose={onClose}
      onUpdateIssue={onUpdate}
      onArchiveIssue={onArchive}
    />
  );
}
