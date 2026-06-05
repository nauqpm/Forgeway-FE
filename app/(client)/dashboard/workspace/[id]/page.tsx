import { AdminGuard } from "@/common/components/AdminGuard";
import { KanbanBoard } from "@/modules/admin";

export const metadata = { title: 'Workspace Board' };

export default function DashboardWorkspaceKanbanPage() {
  return (
    <AdminGuard>
      <KanbanBoard />
    </AdminGuard>
  );
}
