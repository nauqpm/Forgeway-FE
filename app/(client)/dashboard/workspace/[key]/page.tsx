import { AdminGuard } from "@/modules/auth/guards/AdminGuard";
import { KanbanBoard } from "@/modules/admin-shared";

export const metadata = { title: 'Workspace Board' };

export default function DashboardWorkspaceKanbanPage() {
  return (
    <AdminGuard>
      <KanbanBoard />
    </AdminGuard>
  );
}
