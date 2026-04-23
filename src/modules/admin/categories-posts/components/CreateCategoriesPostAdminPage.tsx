"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CategoriesPostForm from "@/modules/admin/categories-posts/components/CategoriesPostForm";

const CategoriesPostCreate = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/admin/categories-posts");
  };

  return (
    <div className="mx-auto">
      <CategoriesPostForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CategoriesPostCreate;
