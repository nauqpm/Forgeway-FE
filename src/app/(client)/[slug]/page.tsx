"use client";


import ClientLayout from "@/modules/client/common/layouts/ClientLayout";
import PostDetailClient from "@/modules/client/post/components/PostDetailClient";
import { useParams } from "next/navigation";

export default function PostDetail() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <ClientLayout>
      <PostDetailClient slug={slug} />{" "}
    </ClientLayout>
  );
}
