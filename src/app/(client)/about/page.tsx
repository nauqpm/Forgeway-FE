import ClientLayout from "@/modules/client/common/layouts/ClientLayout"; // Đường dẫn đúng theo module
import AboutClientPage from "@/modules/client/pages/AboutClientPage";

export default function AboutApp() {
  return (
    <ClientLayout>
      <AboutClientPage />
    </ClientLayout>
  );
}
