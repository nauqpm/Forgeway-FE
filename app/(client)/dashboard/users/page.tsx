import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminUsers } from "@/modules/shared";

export const metadata = { title: 'Users' };

export default function DashboardUsersPage() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}
