import { AdminGuard } from "@/common/components/AdminGuard";
import { WorkspaceSettings } from "@/modules/admin";

export default function WorkspaceSettingsPage() {
  return (
    <AdminGuard>
      <WorkspaceSettings />
    </AdminGuard>
  );
}
