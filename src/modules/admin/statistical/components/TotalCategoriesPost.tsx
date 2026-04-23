import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CategoryPostService } from "@/modules/admin/categories-posts/services/categories-post.service";

const TotalCategoriesPost: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories-post-count"],
    queryFn: async () => {
      // Lấy tất cả danh mục với limit lớn để đảm bảo lấy hết
      const result = await CategoryPostService.findAll(1, 100);
      return result.data.length;
    },
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (error) return <div>Đã xảy ra lỗi khi tải dữ liệu</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-600">
            Tổng danh mục bài viết
          </h3>
          <p className="text-3xl font-bold text-green-600">{data || 0}</p>
        </div>
        <div className="bg-green-100 p-3 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TotalCategoriesPost;