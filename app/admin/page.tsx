import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminDashboard } from "@/modules/admin";

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
