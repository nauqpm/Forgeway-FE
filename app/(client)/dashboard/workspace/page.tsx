import { AdminGuard } from "@/modules/auth/guards/AdminGuard";
import { WorkspaceSettings } from "@/modules/admin-shared";

export const metadata = { title: 'Workspace Settings' };

export default function DashboardWorkspaceSettingsPage() {
  return (
    <AdminGuard>
      <WorkspaceSettings />
    </AdminGuard>
  );
}
