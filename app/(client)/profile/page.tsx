import ClientLayout from "@/modules/client/common/layouts/ClientLayout";
import Profile from "@/modules/client/pages/Profile";

export default function ProfilePage() {
  return (
    <ClientLayout>
      <div className="container mx-auto h-[calc(100vh-400px)]">
        <Profile />
      </div>
    </ClientLayout>
  );
}