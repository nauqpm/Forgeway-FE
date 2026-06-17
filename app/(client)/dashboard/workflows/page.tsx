import { AdminGuard } from "@/modules/auth/guards/AdminGuard";
import { AdminWorkflows } from "@/modules/admin-shared";

export const metadata = { title: 'Workflows' };

export default function DashboardWorkflowsPage() {
  return (
    <AdminGuard>
      <AdminWorkflows />
    </AdminGuard>
  );
}
