"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import CategoriesPostForm from "@/modules/admin/categories-posts/components/CategoriesPostForm";

const CategoriesPostEdit = () => {
  const router = useRouter();
  const params = useParams();

  const slug = params?.slug as string;

  const handleSuccess = () => {
    router.push("/admin/categories-posts");
  };

  if (!slug) return <p className="text-red-500 p-4">❌ Không tìm thấy slug.</p>;

  return (
    <div className="mx-auto mt-6">
      <CategoriesPostForm slug={slug} onSuccess={handleSuccess} />
    </div>
  );
};

export default CategoriesPostEdit;
