"use client";

import { use } from "react";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import { useProjectDetailPage } from "@/modules/client/projects/hooks/useProjectDetailPage";
import ProjectDetailView from "@/modules/client/projects/components/ProjectDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectBoardPage({ params }: PageProps) {
  usePageTitle("Project");
  const { id: projectId } = use(params);
  const {
    project,
    board,
    loading,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCreateTask,
    getTasksByColumn,
  } = useProjectDetailPage(projectId);

  if (loading) return <LoadingSpinner />;
  if (!project) return <div className="app-main text-center text-gray-500">Project not found</div>;

  return (
    <ProjectDetailView
      project={project}
      board={board}
      dragOverColumn={dragOverColumn}
      handleDragStart={handleDragStart}
      handleDragOver={handleDragOver}
      handleDragLeave={handleDragLeave}
      handleDrop={handleDrop}
      handleCreateTask={handleCreateTask}
      getTasksByColumn={getTasksByColumn}
    />
  );
}
