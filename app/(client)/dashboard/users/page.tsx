import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminUsers } from "@/modules/admin";

export default function DashboardUsersPage() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}
