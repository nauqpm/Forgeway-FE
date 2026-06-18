"use client";

import { usePageTitle } from "@/shared/hooks/usePageTitle";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";
import { useProjectsPage } from "@/modules/client/projects/hooks/useProjectsPage";
import ProjectsView from "@/modules/client/projects/components/ProjectsView";

export default function ProjectsPage() {
  usePageTitle("Projects");
  const { currentWorkspace, projects, loading, filtered, search, setSearch, view, setView } =
    useProjectsPage();

  if (!currentWorkspace)
    return <div className="app-main text-center text-gray-500">Select a workspace first</div>;
  if (loading) return <LoadingSpinner />;

  return (
    <ProjectsView
      projects={projects}
      filtered={filtered}
      search={search}
      setSearch={setSearch}
      view={view}
      setView={setView}
    />
  );
}
