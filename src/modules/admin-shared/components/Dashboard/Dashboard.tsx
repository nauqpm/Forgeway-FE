"use client";

import { useMemo, useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useDashboardRealtime(user?.id);

  const displayWorkspaces = useMemo(() => workspaces.slice(0, 4).map(toWorkspaceCard), [workspaces]);
  const assignedTasks = dashboardQuery.data?.assignedTasks ?? [];
  const completedAssignedTasks = dashboardQuery.data?.completedAssignedTasks ?? [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 150) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (dashboardQuery.isLoading) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`flex-1 h-full w-full min-h-0 overflow-y-auto overflow-x-hidden [webkit-overflow-scrolling:touch] p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 ${className}`}
    >
      <div className="app-page-medium app-page-fluid-xl pt-2 sm:pt-4 pb-20 relative">
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
          onSubtaskClick={modal.openSubtask}
        />

        {/* Floating scroll to top button for mobile & desktop */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-full shadow-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline">Top</span>
          </button>
        )}
      </div>
    </div>
  );
}
