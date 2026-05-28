import { AdminGuard } from "@/common/components/AdminGuard";
import { KanbanBoard } from "@/modules/admin";

export default function DashboardWorkspaceKanbanPage() {
  return (
    <AdminGuard>
      <KanbanBoard />
    </AdminGuard>
  );
}
