"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAllPosts } from "../hooks/usePost";
import { Post, PostStatus } from "../models/post.model";
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaSearch,
  FaFilter,
  FaTags,
} from "react-icons/fa";
import { transformSunEditorHtml } from "@/utils/transformSunEditorHtml";

const PostListClient: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const limit = 9;

  const { data: posts, total, isLoading, error } = useAllPosts(page, limit);
  const [loadedPosts, setLoadedPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  // Add posts to loaded posts without duplicates
  useEffect(() => {
    if (posts?.length) {
      // Chỉ lấy các bài viết đã được duyệt và đang hiển thị
      const approvedPosts = posts.filter(
        (post) => post.status === PostStatus.Approved && post.isVisible === true
      );

      setLoadedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.slug));
        const newPosts = approvedPosts.filter((p) => !existingIds.has(p.slug));
        return [...prev, ...newPosts];
      });
    }
  }, [posts]);

  // Filter posts based on search term and category
  useEffect(() => {
    let result = [...loadedPosts];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (post) =>
          post.name.toLowerCase().includes(lowerSearchTerm) ||
          post.excerpt?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (selectedCategory) {
      // Filter by category if needed
      // result = result.filter(post =>
      //   post.category?.main.includes(selectedCategory) ||
      //   post.category?.sub.includes(selectedCategory)
      // );
    }

    setFilteredPosts(result);
  }, [loadedPosts, searchTerm, selectedCategory]);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);
  const hasMore = posts?.length > 0 && page < totalPages;

  // IntersectionObserver for infinite scroll
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !searchTerm &&
          !selectedCategory
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, searchTerm, selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect above
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };

  // Helper function to get thumbnail path
  const getThumbnailPath = (thumbnail: string): string => {
    if (!thumbnail) return "/placeholder.svg?height=800&width=1200";
    const path = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail;
    if (typeof path === "string" && /^(https?:\/\/)/.test(path)) return path;
    if (typeof path === "string" && path.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
    }
    return path;
  };

  // Calculate estimated reading time
  const getReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const textLength = content?.split(" ")?.length || 0;
    if (textLength > 0) {
      return Math.ceil(textLength / wordsPerMinute);
    }
    return 1;
  };

  // Categories (for demo purposes)
  const categories = [
    "Tin tức",
    "Hướng dẫn",
    "Kiến thức",
    "Mẹo hay",
    "Công nghệ",
  ];

  // Hiển thị thông báo khi không có bài viết nào được duyệt
  if (!isLoading && filteredPosts.length === 0) {
    return (
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Bài viết
              </h1>
              <p className="text-gray-600">
                Khám phá những bài viết mới nhất từ chúng tôi
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Không có bài viết nào
            </h3>
            <p className="text-gray-600 mb-6">
              Hiện chưa có bài viết nào được đăng hoặc đã được phê duyệt.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header with title and search */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Bài viết
            </h1>
            <p className="text-gray-600">
              Khám phá những bài viết mới nhất từ chúng tôi
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                <FaSearch />
              </button>
            </form>
            {/*
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FaFilter /> Lọc
            </button> */}
          </div>
        </div>

        {/* Filter section */}
        {isFilterOpen && (
          <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <FaTags className="text-primary" />
              <h3 className="font-medium">Danh mục:</h3>
              <div className="flex flex-wrap gap-2 ml-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(
                        category === selectedCategory ? null : category
                      )
                    }
                    className={`px-3 py-1 rounded-full text-sm ${
                      category === selectedCategory
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {(searchTerm || selectedCategory) && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary hover:text-primary-dark transition"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        )}

        {/* Initial loading state */}
        {isLoading && page === 1 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Đã xảy ra lỗi
            </h2>
            <p className="text-red-600">{(error as Error).message}</p>
          </div>
        )}

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && page === 1
            ? // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))
            : // Actual posts
              filteredPosts.map((post) => (
                <div
                  key={post.slug}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition hover:shadow-md group"
                >
                  <Link href={`/${post.slug}`}>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getThumbnailPath(post.thumbnail)}
                        alt={post.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link href={`/${post.slug}`}>
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition">
                        {post.name}
                      </h3>
                    </Link>

                    <div className="flex items-center text-sm text-gray-500 mb-3 space-x-3">
                      <div className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-primary" />
                        <span>
                          {new Date(post.publishedDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FaClock className="mr-1 text-primary" />
                        <span>{getReadingTime(post.postData)} phút</span>
                      </div>
                    </div>

                    <div
                      className="text-gray-600 mb-4 line-clamp-3 text-sm"
                      dangerouslySetInnerHTML={{
                        __html: transformSunEditorHtml(post.excerpt || ""),
                      }}
                    />

                    <Link
                      href={`/${post.slug}`}
                      className="inline-block text-primary font-medium hover:underline"
                    >
                      Đọc tiếp
                    </Link>
                  </div>
                </div>
              ))}
        </div>

        {/* Load more / pagination */}
        {!isLoading && hasMore && !searchTerm && !selectedCategory && (
          <div ref={observerRef} className="flex justify-center mt-10">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostListClient;
