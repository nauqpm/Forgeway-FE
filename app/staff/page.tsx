import { AdminGuard } from "@/common/components/AdminGuard";
import { AdminDashboard } from "@/modules/admin";

export const metadata = { title: 'Staff Dashboard' };

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  );
}
