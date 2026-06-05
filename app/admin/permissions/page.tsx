import { AdminGuard } from "@/common/components/AdminGuard";
import { Permissions } from "@/modules/admin";

export const metadata = { title: 'Permissions' };

export default function PermissionsPage() {
  return (
    <AdminGuard>
      <Permissions />
    </AdminGuard>
  );
}
