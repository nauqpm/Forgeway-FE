"use client";

import React, { useState, useEffect } from "react";
import {
  useAllPosts,
  usePostsByStatus,
  useSearchPosts,
  useManagerPosts,
} from "../hooks/useManagerPosts";
import { Post, PostStatus } from "../../posts/models/post.model";
import { FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import { PaginatedPosts } from "../services/manager-posts.service";

// Component hiển thị và quản lý trạng thái bài viết
const PostStatusManager: React.FC = () => {
  // State cho phân trang và bộ lọc
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(
    localStorage.getItem("postsPerPage")
      ? Number(localStorage.getItem("postsPerPage"))
      : 10
  );
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [includeHidden, setIncludeHidden] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Hooks để lấy dữ liệu bài viết
  const allPostsQuery = useAllPosts(page, limit);
  const statusFilteredQuery = usePostsByStatus(
    status as PostStatus,
    page,
    limit,
    includeHidden
  );
  const searchQuery = useSearchPosts(searchTerm, page, limit, includeHidden);

  // Hook để cập nhật trạng thái bài viết
  const {
    updateStatus,
    updateVisibility,
    isUpdatingStatus,
    isUpdatingVisibility,
  } = useManagerPosts();

  // Xác định query đang được sử dụng
  const activeQuery = searchTerm
    ? searchQuery
    : status !== "all"
    ? statusFilteredQuery
    : allPostsQuery;

  const { data, isLoading, error } = activeQuery as {
    data: PaginatedPosts;
    isLoading: boolean;
    error: Error | null;
  };

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  // Xử lý thay đổi trạng thái bài viết
  const handleStatusChange = (slug: string, newStatus: PostStatus) => {
    if (isUpdatingStatus) return;

    updateStatus(
      { slug, status: newStatus },
      {
        onSuccess: () => {
          alert(`Đã cập nhật trạng thái bài viết thành ${newStatus}`);
        },
        onError: (error) => {
          alert("Có lỗi xảy ra khi cập nhật trạng thái bài viết");
        },
      }
    );
  };

  // Xử lý thay đổi trạng thái hiển thị
  const handleVisibilityChange = (slug: string, isVisible: boolean) => {
    if (isUpdatingVisibility) return;

    updateVisibility(
      { slug, isVisible },
      {
        onSuccess: () => {
          alert(`Đã ${isVisible ? "hiện" : "ẩn"} bài viết`);
        },
        onError: (error) => {
          alert("Có lỗi xảy ra khi cập nhật trạng thái hiển thị bài viết");
        },
      }
    );
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

  // Hiển thị trạng thái loading
  if (isLoading && !data) {
    return <div>Đang tải...</div>;
  }

  // Hiển thị lỗi
  if (error) {
    return <div>Đã xảy ra lỗi: {(error as Error).message}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Quản lý trạng thái bài viết</h2>

      {/* Bộ lọc và tìm kiếm */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Tìm kiếm */}
        <div className="md:w-1/3">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full px-4 py-2 border rounded-l-md"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
            >
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Lọc theo trạng thái */}
        <div className="md:w-1/3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PostStatus | "all");
              setPage(1);
            }}
            className="w-full px-4 py-2 border rounded-md"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={PostStatus.Draft}>Nháp</option>
            <option value={PostStatus.Pending}>Chờ duyệt</option>
            <option value={PostStatus.Approved}>Đã duyệt</option>
            <option value={PostStatus.Rejected}>Từ chối</option>
          </select>
        </div>

        {/* Lọc bài viết ẩn */}
        <div className="md:w-1/3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={(e) => {
                setIncludeHidden(e.target.checked);
                setPage(1);
              }}
              className="form-checkbox h-5 w-5 text-blue-500"
            />
            <span>Hiển thị cả bài viết đang ẩn</span>
          </label>
        </div>
      </div>

      {/* Bảng hiển thị bài viết */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 border-b text-left">STT</th>
              <th className="py-3 px-4 border-b text-left">Tiêu đề</th>
              <th className="py-3 px-4 border-b text-left">Tác giả</th>
              <th className="py-3 px-4 border-b text-left">Ngày đăng</th>
              <th className="py-3 px-4 border-b text-left">Trạng thái</th>
              <th className="py-3 px-4 border-b text-center">Hiển thị</th>
              {/* <th className="py-3 px-4 border-b text-center">Thao tác</th> */}
            </tr>
          </thead>
          <tbody>
            {!data?.data || data.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                  Không có bài viết nào
                </td>
              </tr>
            ) : (
              data.data.map((post, index) => (
                <tr key={post.slug} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <a
                      href={`/admin/posts/edit/${post.slug}`}
                      className="text-blue-600 hover:underline"
                      title={post.name}
                    >
                      {post.name.length > 50
                        ? post.name.substring(0, 50) + "..."
                        : post.name}
                    </a>
                  </td>
                  <td className="py-3 px-4 border-b">{post.author}</td>
                  <td className="py-3 px-4 border-b">
                    {new Date(post.publishedDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <div className="relative dropdown">
                      <div
                        className={`px-3 py-1 rounded-full text-sm inline-block ${
                          getStatusLabel(post.status).color
                        }`}
                      >
                        {getStatusLabel(post.status).label}
                      </div>
                      <div className="dropdown-content hidden absolute z-10 bg-white shadow-lg rounded-md w-40 py-1">
                        {Object.values(PostStatus).map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(post.slug, status)
                            }
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            {getStatusLabel(status).label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b text-center">
                    <button
                      onClick={() =>
                        handleVisibilityChange(post.slug, !post.isVisible)
                      }
                      className={
                        post.isVisible ? "text-green-600" : "text-red-600"
                      }
                      title={post.isVisible ? "Đang hiển thị" : "Đang ẩn"}
                    >
                      {post.isVisible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </td>
                  {/* <td className="py-3 px-4 border-b text-center">
                    <a
                      href={`/admin/posts/edit/${post.slug}`}
                      className="text-blue-600 hover:underline mx-1"
                    >
                      Sửa
                    </a>
                    <a
                      href={`/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline mx-1"
                    >
                      Xem
                    </a>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="mt-6 flex justify-between items-center">
        <div>
          <span className="text-gray-600">
            Hiển thị {data?.data?.length || 0} / {data?.total || 0} bài viết
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md ${
              page === 1
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-500 text-white"
            }`}
          >
            Trước
          </button>

          <span className="px-4 py-2 bg-gray-100 rounded-md">
            Trang {page} / {Math.ceil((data?.total || 0) / limit)}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || page >= Math.ceil(data.total / limit)}
            className={`px-4 py-2 rounded-md ${
              !data || page >= Math.ceil(data.total / limit)
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
                setPage(1);
                localStorage.setItem("postsPerPage", newLimit.toString());
              }}
              className="px-3 py-2 border rounded-md"
            >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default PostStatusManager;
