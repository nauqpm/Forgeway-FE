// src/modules/posts/components/PostList.tsx
"use client";

import React, { useState } from "react";
import {
  usePosts,
  useMyPosts,
  usePostsByStatus,
} from "@/modules/admin/posts/hooks/usePosts";
import { Post, PostStatus } from "@/modules/admin/posts/models/post.model";
import SearchProducts from "./SearchProducts";
import { useAuth } from "@/context/AuthContext";
import { PaginatedPosts } from "../../manager-posts/services/manager-posts.service";
import { useSearchPosts } from "../../manager-posts/hooks/useManagerPosts";
import { useAllPosts } from "../../manager-posts/hooks/useManagerPosts";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * Hàm định dạng ngày giờ từ chuỗi ISO thành định dạng hiển thị
 * @param dateInput Chuỗi ISO hoặc đối tượng Date
 * @returns Object chứa date và time đã định dạng
 */
const formatDateTime = (
  dateInput?: string | Date
): { date: string; time: string } => {
  if (!dateInput) return { date: "Không xác định", time: "Không xác định" };

  // Tạo đối tượng Date từ chuỗi ISO
  const date = new Date(dateInput);

  // Format ngày tháng theo định dạng Việt Nam
  const dateStr = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC", // Quan trọng: sử dụng múi giờ UTC
  });

  // Format giờ phút theo định dạng 24 giờ
  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC", // Quan trọng: sử dụng múi giờ UTC
  });

  return { date: dateStr, time: timeStr };
};

// Hàm lấy label hiển thị cho trạng thái
const getStatusLabel = (
  status: PostStatus
): { label: string; color: string } => {
  switch (status) {
    case PostStatus.Draft:
      return { label: "Nháp", color: "bg-gray-200 text-gray-800" };
    case PostStatus.Pending:
      return { label: "Chờ duyệt", color: "bg-yellow-200 text-yellow-800" };
    case PostStatus.Approved:
      return { label: "Đã duyệt", color: "bg-green-200 text-green-800" };
    case PostStatus.Rejected:
      return { label: "Từ chối", color: "bg-red-200 text-red-800" };
    default:
      return { label: "Không xác định", color: "bg-gray-200 text-gray-800" };
  }
};

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

const PostList: React.FC = () => {
  const activeTab = useState<"all" | "my">("all");
  const {
    postsQuery,
    hardDeleteMutation,
    updateVisibilityMutation,
    updateStatusMutation,
    page: allPostsPage,
    setPage: setAllPostsPage,
    includeHidden,
    setIncludeHidden,
    statusFilter,
    setStatusFilter,
  } = usePosts();
  const { user, hasPermission } = useAuth();
  const {
    myPostsQuery,
    page: myPostsPage,
    setPage: setMyPostsPage,
  } = useMyPosts(user?.id || "");

  const [isSearching, setIsSearching] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(
    localStorage.getItem("postsPerPage")
      ? Number(localStorage.getItem("postsPerPage"))
      : 10
  );
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Kiểm tra quyền
  const canPublish = hasPermission("posts", "publish");
  const canApprove = hasPermission("posts", "approve");
  const canEdit = hasPermission("posts", "update");
  const canDelete = hasPermission("posts", "delete");

  // Hooks để lấy dữ liệu bài viết
  const allPostsQuery = useAllPosts(page, limit);
  const statusFilteredQuery = usePostsByStatus(
    status as PostStatus,
    includeHidden
  );
  const searchQuery = useSearchPosts(searchTerm, page, limit, includeHidden);

  // Chọn dữ liệu hiển thị dựa trên tab đang active
  const activeQuery =
    activeTab[0] === "my"
      ? searchTerm
        ? { ...myPostsQuery, data: myPostsQuery.data } // Use myPostsQuery with search applied client-side later
        : {
            data: myPostsQuery.data,
            isLoading: myPostsQuery.isLoading,
            error: myPostsQuery.error,
            refetch: myPostsQuery.refetch,
          }
      : searchTerm
      ? searchQuery
      : status !== "all"
      ? {
          data: statusFilteredQuery.postsByStatusQuery.data,
          isLoading: statusFilteredQuery.postsByStatusQuery.isLoading,
          error: statusFilteredQuery.postsByStatusQuery.error,
          refetch: statusFilteredQuery.postsByStatusQuery.refetch,
        }
      : allPostsQuery;

  const { data: rawData } = activeQuery as {
    data: PaginatedPosts;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<any>;
  };

  // Apply client-side search to "Bài viết của tôi" tab if searchTerm exists
  const data =
    searchTerm && activeTab[0] === "my" && rawData
      ? {
          ...rawData,
          data: rawData.data?.filter(
            (post: Post) =>
              post.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }
      : rawData;

  // Hàm để cập nhật lại dữ liệu sau khi thay đổi
  const refreshData = () => {
    // Gọi refetch dựa vào loại query hiện tại và tab đang active
    if (activeTab[0] === "my") {
      myPostsQuery.refetch?.();
      return;
    }

    if (searchTerm) {
      searchQuery.refetch?.();
    } else if (status !== "all") {
      statusFilteredQuery.postsByStatusQuery.refetch?.();
    } else {
      allPostsQuery.refetch?.();
    }
  };

  // Xử lý xóa bài viết với confirm
  const handleDelete = async (id: string, slug: string) => {
    if (!canDelete) {
      alert("Bạn không có quyền xóa bài viết");
      return;
    }

    if (confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      try {
        await hardDeleteMutation.mutateAsync(slug);
      } catch (error) {
        console.error("Lỗi khi xóa bài viết:", error);
      }
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = (term: string) => {
    setIsSearching(true);

    // Reset relevant page number based on active tab
    if (activeTab[0] === "my") {
      setMyPostsPage(1);
    } else {
      setAllPostsPage(1);
    }

    setSearchTerm(term.trim());
    setIsSearching(false);
  };

  // Xử lý thay đổi trạng thái hiển thị
  const handleVisibilityChange = (slug: string, isVisible: boolean) => {
    if (!canPublish) {
      alert("Bạn không có quyền thay đổi trạng thái hiển thị bài viết");
      return;
    }

    if (updateVisibilityMutation.isPending) return;

    updateVisibilityMutation.mutate(
      { slug, isVisible },
      {
        onSuccess: () => {
          // Cập nhật cache để hiển thị thay đổi ngay lập tức
          refreshData();
          alert(`Đã ${isVisible ? "hiện" : "ẩn"} bài viết`);
        },
        onError: (error) => {
          alert("Có lỗi xảy ra khi cập nhật trạng thái hiển thị bài viết");
        },
      }
    );
  };

  // Xử lý toggle hiển thị bài viết
  const handleToggleVisibility = async (
    slug: string,
    currentVisibility: boolean
  ) => {
    if (!canPublish) {
      alert("Bạn không có quyền thay đổi trạng thái hiển thị bài viết");
      return;
    }

    try {
      await updateVisibilityMutation.mutateAsync({
        slug,
        isVisible: !currentVisibility,
      });

      // Cập nhật cache để hiển thị thay đổi ngay lập tức
      refreshData();
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái hiển thị:", error);
    }
  };

  // Xử lý cập nhật trạng thái phê duyệt
  const handleUpdateStatus = async (slug: string, newStatus: PostStatus) => {
    if (!canApprove) {
      alert("Bạn không có quyền phê duyệt bài viết");
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        slug,
        status: newStatus,
      });

      // Cập nhật cache để hiển thị thay đổi ngay lập tức
      refreshData();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái phê duyệt:", error);
    }
  };

  // Xử lý bộ lọc trạng thái
  const handleStatusFilter = (newStatus: PostStatus | null) => {
    if (newStatus === null) {
      setStatus("all");
    } else {
      setStatus(newStatus);
    }
    setPage(1);
    setShowStatusFilter(false);
  };

  // Xử lý thay đổi includeHidden
  const handleIncludeHiddenChange = () => {
    setIncludeHidden(!includeHidden);
    // Reset page when changing filter
    if (activeTab[0] === "my") {
      setMyPostsPage(1);
    } else {
      setPage(1);
    }
    // Let React Query handle the refetch
  };

  const currentPage = activeTab[0] === "my" ? myPostsPage : page;

  // Handle tab switching
  const handleTabChange = (tab: "all" | "my") => {
    activeTab[1](tab);
    // Reset search term when switching tabs
    if (searchTerm) {
      setSearchTerm("");
      setIsSearching(false);
    }
  };

  if (postsQuery.isLoading && !postsQuery.data) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-lg flex justify-center">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap mb-2 md:mb-0">
            Danh sách bài viết
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleTabChange("all")}
                className={`px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab[0] === "all"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tất cả bài viết
              </button>
              <button
                onClick={() => handleTabChange("my")}
                className={`px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab[0] === "my"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-[#fbf5ab] text-black hover:bg-[#f7ef7e]"
                }`}
              >
                Bài viết của tôi
              </button>
            </div>
            <a
              href="/admin/posts/create"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-center"
            >
              + Thêm mới bài viết
            </a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 min-w-[220px]">
            <SearchProducts
              onSearch={handleSearch}
              isSearching={isSearching}
              placeholder={
                activeTab[0] === "my"
                  ? "Tìm trong bài viết của tôi..."
                  : "Nhập tên bài viết cần tìm..."
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeHidden}
                onChange={handleIncludeHiddenChange}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-700">
                Hiển thị bài ẩn
              </span>
            </label>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
            >
              <span>Lọc theo trạng thái</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showStatusFilter && (
              <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-lg p-2 min-w-[200px] z-50">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      handleStatusFilter(null);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 rounded-lg text-left"
                  >
                    Tất cả trạng thái
                  </button>
                  {Object.values(PostStatus).map((status) => {
                    const { label, color } = getStatusLabel(status);
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          handleStatusFilter(status);
                        }}
                        className={`px-4 py-2 hover:bg-gray-100 rounded-lg text-left flex items-center gap-2`}
                      >
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${color}`}
                        >
                          {label}
                        </span>
                        <span>{statusFilter === status && "✓"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white max-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiển thị
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đăng
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((post: Post, index: number) => {
                const { date, time } = formatDateTime(post.publishedDate);
                const { label: statusLabel, color: statusColor } =
                  getStatusLabel(post.status || PostStatus.Draft);

                return (
                  <tr
                    key={post.slug}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-[320px] truncate">
                      {post.name}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[80px] truncate">
                      {post.author || "Không rõ"}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm">
                      <div className="relative group">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${statusColor} cursor-pointer`}
                        >
                          {statusLabel}
                        </span>

                        {canApprove && (
                          <div className="absolute hidden group-hover:block top-0 left-16 bg-white shadow-lg rounded-lg p-2 z-50 min-w-[150px] ml-1 -mt-14">
                            <div className="flex flex-col gap-1">
                              {Object.values(PostStatus).map((status) => {
                                const { label, color } = getStatusLabel(status);
                                if (status === post.status) return null;

                                return (
                                  <button
                                    key={status}
                                    onClick={() =>
                                      handleUpdateStatus(post.slug, status)
                                    }
                                    className={`px-2 py-1 text-xs ${color} rounded-full hover:opacity-80 text-center`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b text-center">
                      <div className="relative group">
                        <button
                          onClick={() =>
                            handleVisibilityChange(post.slug, !post.isVisible)
                          }
                          disabled={!canPublish}
                          className={`${
                            post.isVisible ? "text-green-600" : "text-red-600"
                          } ${
                            !canPublish
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          title={
                            !canPublish
                              ? "Bạn không có quyền thay đổi trạng thái hiển thị"
                              : post.isVisible
                              ? "Đang hiển thị"
                              : "Đang ẩn"
                          }
                        >
                          {post.isVisible ? <FaEye /> : <FaEyeSlash />}
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                      {date} {time}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1 relative">
                        <a
                          href={`/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900 bg-green-100 px-2 py-1 rounded-md hover:bg-green-200 transition-all duration-200"
                        >
                          Xem
                        </a>
                        {canEdit && (
                          <a
                            href={`/admin/posts/edit/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 px-2 py-1 rounded-md hover:bg-yellow-200 transition-all duration-200"
                          >
                            Sửa
                          </a>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(post.id, post.slug)}
                            className="text-red-600 hover:text-red-900 bg-red-100 px-2 py-1 rounded-md hover:bg-red-200 transition-all duration-200"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="mt-6 flex justify-between items-center relative z-10">
          <div>
            <span className="text-gray-600">
              Hiển thị {data?.data?.length || 0} / {data?.total || 0} bài viết
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (activeTab[0] === "my") {
                  setMyPostsPage((p) => Math.max(p - 1, 1));
                } else {
                  setPage((p) => Math.max(p - 1, 1));
                }
              }}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500"
                  : "bg-blue-500 text-white"
              }`}
            >
              Trước
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md">
              Trang {currentPage} / {Math.ceil((data?.total || 0) / limit)}
            </span>

            <button
              onClick={() => {
                if (activeTab[0] === "my") {
                  setMyPostsPage((p) => p + 1);
                } else {
                  setPage((p) => p + 1);
                }
              }}
              disabled={!data || currentPage >= Math.ceil(data.total / limit)}
              className={`px-4 py-2 rounded-md ${
                !data || currentPage >= Math.ceil(data.total / limit)
                  ? "bg-gray-200 text-gray-500"
                  : "bg-blue-500 text-white"
              }`}
            >
              Sau
            </button>
          </div>

          <div>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                if (activeTab[0] === "my") {
                  setMyPostsPage(1);
                } else {
                  setPage(1);
                }
                localStorage.setItem("postsPerPage", newLimit.toString());
              }}
              className="px-3 py-2 border rounded-md z-0"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostList;
