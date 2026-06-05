import { AdminGuard } from "@/common/components/AdminGuard";
import { Permissions } from "@/modules/admin";

export const metadata = { title: 'Permissions' };

export default function DashboardPermissionsPage() {
  return (
    <AdminGuard>
      <Permissions />
    </AdminGuard>
  );
}
