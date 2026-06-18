import { AdminGuard } from "@/modules/auth/guards/AdminGuard";
import { Permissions } from "@/modules/admin-shared";

export const metadata = { title: 'Permissions' };

export default function DashboardPermissionsPage() {
  return (
    <AdminGuard>
      <Permissions />
    </AdminGuard>
  );
}
