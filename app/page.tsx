import ClientLayout from "@/modules/client/common/layouts/ClientLayout"; // Đường dẫn đúng theo module
import HomeClientPage from "@/modules/client/home/components/home"; // Đường dẫn đúng theo module

export default function HomeClient() {
  return (
    <ClientLayout>
      <HomeClientPage />
    </ClientLayout>
  );
}
