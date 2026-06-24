"use client";

import { useMemo } from "react";
import { useDashboardData } from "@/modules/admin-shared/hooks/useDashboardData";
import { useDashboardTaskModal } from "@/modules/admin-shared/hooks/useDashboardTaskModal";

export function useForYouPage() {
  const dashboardQuery = useDashboardData();
  const workspaces = useMemo(
    () => dashboardQuery.data?.workspaces ?? [],
    [dashboardQuery.data?.workspaces],
  );
  const assignedTasks = dashboardQuery.data?.assignedTasks ?? [];
  const completedAssignedTasks = dashboardQuery.data?.completedAssignedTasks ?? [];

  const modal = useDashboardTaskModal(workspaces, { returnPath: "/for-you" });

  const stats = useMemo(() => {
    const owned = workspaces.filter(
      (w) => ["owner", "owned"].includes((w.relationship ?? "").toLowerCase()) || w.role === "owner",
    ).length;
    const joined = Math.max(workspaces.length - owned, 0);
    const active = workspaces.filter((w) => w.status !== "archived").length;
    return { owned, joined, active };
  }, [workspaces]);

  return {
    workspaces,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    assignedTasks,
    completedAssignedTasks,
    modal,
    stats,
  };
}
