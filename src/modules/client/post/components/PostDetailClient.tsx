"use client";

import React from "react";
import Link from "next/link";
import { usePostBySlug, useAllPosts } from "../hooks/usePost";
import { transformSunEditorHtml } from "@/utils/transformSunEditorHtml";
import { Post, PostStatus } from "../models/post.model";
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaArrowLeft,
  FaShare,
} from "react-icons/fa";
import "@/styles/globals.css";
import "@/styles/suneditor.min.css";

interface PostDetailClientProps {
  slug: string;
}

export default function PostDetailClient({ slug }: PostDetailClientProps) {
  const { data: post, isLoading, isError, error } = usePostBySlug(slug);
  const { data: allPosts } = useAllPosts();

  // Lọc bài viết gần đây (chỉ lấy bài đã duyệt và hiển thị)
  const recentPosts =
    allPosts
      ?.filter(
        (post) => post.status === PostStatus.Approved && post.isVisible === true
      )
      .slice(0, 4) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Đang tải bài viết...</p>
      </div>
    );
  }

  // Kiểm tra nếu bài viết không tồn tại hoặc chưa được duyệt hoặc không hiển thị
  if (
    isError ||
    !post ||
    post.status !== PostStatus.Approved ||
    !post.isVisible
  ) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-2xl mx-auto my-10">
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
          Không thể tải bài viết
        </h2>
        <p className="text-red-600 mb-6">
          {error instanceof Error &&
          error.message.includes("không tồn tại hoặc chưa được phê duyệt")
            ? "Bài viết này không tồn tại hoặc chưa được phê duyệt."
            : "Bài viết không tồn tại hoặc đã bị xóa."}
        </p>
        <Link
          href="/posts"
          className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
        >
          <FaArrowLeft className="mr-2" /> Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

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
    const textLength = content.split(" ").length;
    if (textLength > 0) {
      return Math.ceil(textLength / wordsPerMinute);
    }
    return 1;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/"
                className="text-gray-500 hover:text-primary transition"
              >
                Trang chủ
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link
                  href="/posts"
                  className="text-gray-500 hover:text-primary transition"
                >
                  Bài viết
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-primary" aria-current="page">
                  {post.name.length > 30
                    ? post.name.substring(0, 30) + "..."
                    : post.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {/* Featured image */}
              <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
                <img
                  src={getThumbnailPath(post.thumbnail)}
                  alt={post.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t  to-transparent p-6">
                  {/* <div className="flex flex-wrap gap-2 mb-3">
                    {["Tin tức", "Kiến thức"].map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div> */}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm pb-6 border-b">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-black leading-tight">
                    {post.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    <span>
                      {new Date(post.publishedDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <FaUser className="text-primary" />
                    <span>{post.author}</span>
                  </div> */}
                  {/* <div className="flex items-center gap-2">
                    <FaClock className="text-primary" />
                    <span>{readingTime} phút đọc</span>
                  </div> */}
                  <div className="ml-auto">
                    <button className="flex items-center gap-2 text-primary hover:text-primary-dark transition">
                      <FaShare /> Chia sẻ
                    </button>
                  </div>
                </div>

                {/* <div
                  className="flex flex-col top-0 mb-8 text-gray-700 italic leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-primary transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: "100vh",
                    overflowY: "auto",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: transformSunEditorHtml(post.excerpt),
                  }}
                /> */}

                {/* Post content */}
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none text-gray-800">
                  <div
                    className="sun-editor sun-editor-editable"
                    dangerouslySetInnerHTML={{
                      __html: transformSunEditorHtml(post.postData),
                    }}
                  />
                </div>

                {/* Author box */}
                {/* <div className="mt-10 pt-8 border-t">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      <img
                        src="/author-avatar.jpg"
                        alt={post.author}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(post.author) +
                            "&background=random";
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{post.author}</h3>
                      <p className="text-gray-600 text-sm">Tác giả</p>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Link
                href="/posts"
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-50 transition"
              >
                <FaArrowLeft /> Quay lại danh sách
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-8 lg:sticky lg:top-24">
              {/* Recent Posts */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  Bài viết mới
                </h3>
                <div className="space-y-4 divide-y">
                  {recentPosts.map((recent: Post) => (
                    <Link
                      key={recent._id}
                      href={`/${recent.slug}`}
                      className={`block pt-4 first:pt-0 group ${
                        recent.slug === slug
                          ? "opacity-60 pointer-events-none"
                          : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-16 flex-shrink-0 rounded-md overflow-hidden">
                          <img
                            src={getThumbnailPath(recent.thumbnail)}
                            alt={recent.name}
                            className="object-cover w-full h-full group-hover:scale-110 transition duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 text-gray-800 group-hover:text-primary transition">
                            {recent.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <FaCalendarAlt className="mr-1" size={10} />
                            {new Date(recent.publishedDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Thẻ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Tin tức",
                    "Hướng dẫn",
                    "Kiến thức",
                    "Mẹo hay",
                    "Công nghệ",
                    "Thủ thuật",
                  ].map((tag) => (
                    <div
                      key={tag}
                      className="bg-gray-100 hover:bg-primary hover:text-white text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-2">Đăng ký nhận bản tin</h3>
                <p className="text-sm text-white/80 mb-4">
                  Nhận thông báo khi có bài viết mới
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button className="w-full bg-white text-primary hover:bg-gray-100 transition font-medium rounded-lg px-4 py-2">
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Styles để video responsive */}
      <style jsx global>{`
        .post-content :global(iframe),
        .post-content :global(video) {
          width: 100% !important;
          aspect-ratio: 16/9;
          height: auto !important;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .post-content :global(img) {
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .post-content :global(h2) {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #1f2937;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .post-content :global(h3) {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #374151;
        }

        .post-content :global(p) {
          margin-bottom: 1rem;
          line-height: 1.7;
        }

        .post-content :global(ul) {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .post-content :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .post-content :global(blockquote) {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          font-style: italic;
          margin: 1.5rem 0;
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  );
}
