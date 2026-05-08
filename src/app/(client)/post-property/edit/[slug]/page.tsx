import ClientLayout from "@/modules/client/common/layouts/ClientLayout";
import EditProperty from "@/modules/client/pages/EditProperty";

interface EditPropertyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { slug } = await params;
  return (
    <ClientLayout>
      <EditProperty slug={slug} />
    </ClientLayout>
  )
}