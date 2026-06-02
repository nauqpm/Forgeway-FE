import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminWorkflows } from "@/modules/admin";

export const metadata = { title: 'Workflows' };

export default function AdminWorkflowsPage() {
  return (
    <AdminGuard>
      <AdminWorkflows />
    </AdminGuard>
  );
}
