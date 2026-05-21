import { AdminGuard } from "@/common/components/AdminGuard";
import { KanbanBoard } from "@/modules/admin";

export default function WorkspaceKanbanPage() {
  return (
    <AdminGuard>
      <KanbanBoard />
    </AdminGuard>
  );
}
