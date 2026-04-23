// src/app/admin/posts/create/page.tsx
"use client";

import React from "react";
import PostForm from "@/modules/admin/posts/components/FormPost";
import { CreatePostDto } from "@/modules/admin/posts/models/post.model";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createPost } from "@/modules/admin/posts/services/post.service";

const CreatePostPage = () => {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (data: CreatePostDto) => createPost(data),
    onSuccess: () => {
      alert("✅ Tạo bài viết thành công!");
      router.push("/admin/posts");
    },
    onError: () => {
      alert("❌ Tạo bài viết thất bại. Vui lòng thử lại.");
    },
  });

  const handleSubmit = (data: CreatePostDto) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-4">Tạo bài viết mới</h1>
      <PostForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreatePostPage;
