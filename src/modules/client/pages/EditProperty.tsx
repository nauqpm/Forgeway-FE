import EditPropertyPost from "../post-property/EditPropertyPost";

interface EditPropertyProps {
  slug: string;
}

export default function EditProperty({ slug }: EditPropertyProps) {
  return <EditPropertyPost slug={slug} />;
}