"use client";

import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { useMyTasksPage } from "@/modules/client/my-tasks/hooks/useMyTasksPage";
import MyTasksView from "@/modules/client/my-tasks/components/MyTasksView";
import LoadingSpinner from "@/modules/admin-shared/components/common/components/LoadingSpinner";

export default function MyTasksPage() {
  usePageTitle("My Tasks");
  const page = useMyTasksPage();
  if (page.loading) return <LoadingSpinner />;
  return <MyTasksView {...page} />;
}
