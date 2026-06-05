import { AdminGuard } from "@/common/components/AdminGuard";
import { WorkspaceSettings } from "@/modules/admin";

export const metadata = { title: 'Workspace Settings' };

export default function WorkspaceSettingsPage() {
  return (
    <AdminGuard>
      <WorkspaceSettings />
    </AdminGuard>
  );
}
