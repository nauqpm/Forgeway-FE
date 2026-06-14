import { AdminGuard } from "@/common/components/AdminGuard";
import { WorkspaceSettings } from "@/modules/shared";

export const metadata = { title: 'Workspace Settings' };

export default function DashboardWorkspaceSettingsPage() {
  return (
    <AdminGuard>
      <WorkspaceSettings />
    </AdminGuard>
  );
}
