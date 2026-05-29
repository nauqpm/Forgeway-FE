import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminWorkflows } from "@/modules/admin";

export default function DashboardWorkflowsPage() {
  return (
    <AdminGuard>
      <AdminWorkflows />
    </AdminGuard>
  );
}
