import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminUsers } from "@/modules/admin";

export const metadata = { title: 'Users' };

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  );
}
