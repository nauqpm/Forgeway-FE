"use client";

import ClientLayout from "@/modules/client/common/layouts/ClientLayout"; // Đường dẫn đúng theo module
import PostListClientPage from "@/modules/client/pages/PostListClientPage";
// import ContactClientPage from "@/modules/client/pages/ContactClientPage";

export default function PostsApp() {
  return (
    <ClientLayout>
      <PostListClientPage />
    </ClientLayout>
  );
}
