import ClientLayout from "@/modules/client/common/layouts/ClientLayout"; // Đường dẫn đúng theo module
import ContactClientPage from "@/modules/client/pages/ContactClientPage";

export default function AboutApp() {
  return (
    <ClientLayout>
      <ContactClientPage />
    </ClientLayout>
  );
}
