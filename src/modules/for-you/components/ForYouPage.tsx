"use client";

import { Loader2 } from "lucide-react";
import { useForYouPage } from "../hooks/useForYouPage";
import { ForYouWorkspaceGrid } from "./ForYouWorkspaceGrid";
import { DashboardTaskList } from "@/modules/admin-shared/components/Dashboard/DashboardTaskList";
import { DashboardTaskModal } from "@/modules/admin-shared/components/Dashboard/DashboardTaskModal";

export default function ForYouPage() {
  const { workspaces, isLoading, error, assignedTasks, completedAssignedTasks, modal, stats } = useForYouPage();

  if (isLoading) {
    return (
      <div className="flex-1 flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-[var(--app-page-pad)]">
      <div className="app-page-medium">
        <ForYouWorkspaceGrid workspaces={workspaces} stats={stats} error={error} />

        <DashboardTaskList
          title="My Tasks"
          assignedTasks={assignedTasks}
          completedCount={completedAssignedTasks.length}
          workspaceCount={workspaces.length}
          onOpenTask={modal.open}
        />

        <DashboardTaskModal
          isOpen={modal.isOpen}
          isLoading={modal.isLoading}
          selectedTask={modal.selectedTask}
          taskDetail={modal.taskDetail}
          boardColumns={modal.boardColumns}
          sprints={modal.sprints}
          workspaceMembers={modal.workspaceMembers}
          workspaces={workspaces}
          onClose={modal.close}
          onUpdate={modal.update}
          onArchive={modal.archive}
        />
      </div>
    </div>
  );
}
