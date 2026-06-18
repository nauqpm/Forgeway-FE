import { AdminGuard } from "@/modules/auth/guards/AdminGuard";
import { AdminUsers } from "@/modules/admin-shared";

export const metadata = { title: 'Users' };

export default function DashboardUsersPage() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}
