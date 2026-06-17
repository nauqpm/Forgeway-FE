"use client";

import { useParams } from "next/navigation";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useTaskDetailPage } from "@/modules/client/tasks/hooks/useTaskDetailPage";
import TaskDetailView from "@/modules/client/tasks/components/TaskDetailView";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const page = useTaskDetailPage(id);

  usePageTitle(page.task?.key ?? "Task");

  if (page.loading) return <LoadingSpinner />;

  return <TaskDetailView {...page} />;
}
