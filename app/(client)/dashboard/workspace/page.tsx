import { AdminGuard } from "@/common/components/AdminGuard";
import { WorkspaceSettings } from "@/modules/admin";

export default function DashboardWorkspaceSettingsPage() {
  return (
    <AdminGuard>
      <WorkspaceSettings />
    </AdminGuard>
  );
}
