"use client";

import { useAuth } from "@/context/AuthContext";
import { useCategoryPosts } from "@/modules/admin/categories-posts/hooks/useCategoriesPost";
import { CategoryPost } from "@/modules/admin/categories-posts/models/categories-post.model";
import { useState } from "react";



// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-12 bg-gray-200 rounded mb-4"></div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);

const CategoriesPostList = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { listQuery, hardDeleteMutation } = useCategoryPosts(page, limit);

  const handleDelete = async (slug: string) => {
    if (!slug) return alert("❌ Không thể xoá vì thiếu slug!");

    const confirmDelete = confirm("❗ Xác nhận xoá vĩnh viễn danh mục?");
    if (!confirmDelete) return;

    try {
      await hardDeleteMutation.mutateAsync(slug);
      alert("✅ Đã xoá thành công!");
    } catch (error) {
      console.error("❌ Xoá thất bại:", error);
      alert("❌ Xoá thất bại!");
    }
  };

  if (listQuery.isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <LoadingSkeleton />
      </div>
    );
  }

  const hasNextPage = !!listQuery.data && listQuery.data.length >= limit;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 whitespace-nowrap mb-2 md:mb-0">
          📚 Danh sách danh mục bài viết
        </h2>

        <div className="flex items-center gap-4">
            <a
            href="/admin/categories-posts/create"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-center whitespace-nowrap"
            >
              + Thêm danh mục
            </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên danh mục
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục cha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listQuery.data && listQuery.data.length > 0 ? (
              listQuery.data.map((category: CategoryPost, index: number) => {
                const parentCategory = category.parent
                  ? listQuery.data.find(
                      (cat: CategoryPost) => cat._id === category.parent
                    )
                  : null;

                return (
                  <tr
                    key={category._id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {parentCategory ? parentCategory.name : "Không có"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center gap-2">
                        <a
                          href={`/admin/categories-posts/edit/${category.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 px-3 py-1 rounded-md hover:bg-yellow-200 transition-all duration-200"
                        >
                          ✏️ Sửa
                        </a>
                        <button
                          onClick={() => handleDelete(category.slug)}
                          className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md hover:bg-red-200 transition-all duration-200"
                        >
                          🗑️ Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500 bg-gray-50"
                >
                  Không có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            page === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          ← Trang trước
        </button>

        <span className="text-gray-700 font-medium">Trang {page}</span>

        <button
          disabled={!hasNextPage}
          onClick={() => setPage((prev) => prev + 1)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            !hasNextPage
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          }`}
        >
          Trang sau →
        </button>
      </div>
    </div>
  );
};

export default CategoriesPostList;
