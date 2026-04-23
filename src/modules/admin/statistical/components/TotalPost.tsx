import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PostService } from "@/modules/admin/posts/services/post.service";

const TotalPost: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts-count"],
    queryFn: async () => {
      try {
        // Lấy tổng số bài viết từ API với limit lớn
        const response = await PostService.getAll(1, 1);
        return response.total || 0;
      } catch (error) {
        console.error("Error fetching posts:", error);
        return 0;
      }
    },
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div>Đã xảy ra lỗi khi tải dữ liệu</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-600">Tổng bài viết</h3>
          <p className="text-3xl font-bold text-blue-600">{data || 0}</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TotalPost;
