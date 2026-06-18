"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/modules/admin-shared/hooks/useDashboardData";
import { useDashboardTaskModal } from "@/modules/admin-shared/hooks/useDashboardTaskModal";
import { useDashboardRealtime } from "@/modules/admin-shared/hooks/useDashboardRealtime";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { toWorkspaceCard } from "@/modules/admin-shared/utils/dashboard.utils";
import { DashboardWorkspaceGrid } from "./DashboardWorkspaceGrid";
import { DashboardTaskList } from "./DashboardTaskList";
import { DashboardTaskModal } from "./DashboardTaskModal";

export interface AdminDashboardProps {
  className?: string;
}

export default function AdminDashboard({ className = "" }: AdminDashboardProps) {
  const { user } = useAuth();
  const dashboardQuery = useDashboardData();
  const workspaces = useMemo(() => dashboardQuery.data?.workspaces ?? [], [dashboardQuery.data?.workspaces]);
  const modal = useDashboardTaskModal(workspaces);

  useDashboardRealtime(user?.id);

  const displayWorkspaces = useMemo(() => workspaces.slice(0, 4).map(toWorkspaceCard), [workspaces]);
  const assignedTasks = dashboardQuery.data?.assignedTasks ?? [];
  const completedAssignedTasks = dashboardQuery.data?.completedAssignedTasks ?? [];

  if (dashboardQuery.isLoading) return null;

  return (
    <div className={`app-page-medium pt-6 ${className}`}>
      <DashboardWorkspaceGrid workspaces={displayWorkspaces} />

      <DashboardTaskList
        assignedTasks={assignedTasks}
        completedCount={completedAssignedTasks.length}
        workspaceCount={workspaces.length}
        onOpenTask={modal.open}
        showAllHref="/for-you"
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
  );
}
