"use client";

import React from "react";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { useAllPosts } from "../../post/hooks/usePost"; // lấy từ backend
import { getThumbnailPath } from "@/utils/getThumbnailPath"; // hàm xử lý ảnh

const NewsPostClient = () => {
  const { data: posts = [], isLoading, error } = useAllPosts();

  // 👉 Giới hạn 12 bài đầu tiên
  const top12Posts = posts.slice(0, 12);
  const bigNews = top12Posts.slice(0, 4);
  const smallNews = top12Posts.slice(4);

  return (
    <section className="w-full py-12 md:py-16 bg-gray-100">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <h2
          className="text-2xl md:text-3xl font-bold mb-8 text-center
                    bg-clip-text text-transparent
                    bg-gradient-to-r from-indigo-600 to-teal-500"
          data-aos="fade-up"
        >
          TIN TỨC &amp; SỰ KIỆN
        </h2>

        {isLoading && (
          <div className="text-center text-gray-500 py-10">
            Đang tải bài viết...
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 py-10">
            Lỗi: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Big News (4 bài đầu) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {bigNews.map((n, i) => (
                <article
                  key={n._id}
                  className="bg-white rounded-lg overflow-hidden shadow-custom"
                  data-aos="fade-up"
                  data-aos-delay={150 + i * 50}
                >
                  <div className="relative">
                    <img
                      src={getThumbnailPath(n.thumbnail)}
                      alt={n.name}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute top-4 left-4 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Nổi bật
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-primary transition-colors line-clamp-2">
                      <Link href={`/${n.slug}`}>{n.name}</Link>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {n.excerpt}
                    </p>
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/${n.slug}`}
                        className="text-primary font-medium hover:text-secondary transition-colors flex items-center"
                      >
                        Xem thêm <FaArrowRight className="ml-2" />
                      </Link>
                      <span className="text-xs text-gray-500">
                        {new Date(n.publishedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Small News (8 bài sau) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {smallNews.map((s, i) => (
                <article
                  key={s._id}
                  className="bg-white rounded-lg p-4 flex items-start space-x-3"
                  data-aos="fade-up"
                  data-aos-delay={100 + i * 50}
                >
                  <img
                    src={getThumbnailPath(s.thumbnail)}
                    alt={s.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-primary transition-colors">
                      <Link href={`/${s.slug}`}>{s.name}</Link>
                    </h4>
                    <Link
                      href={`/${s.slug}`}
                      className="text-primary text-xs font-medium hover:text-secondary transition-colors flex items-center"
                    >
                      Xem thêm <FaArrowRight className="ml-1 text-xs" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="text-center mt-8" data-aos="fade-up">
          <Link
            href="/posts"
            className="inline-block text-white font-medium px-6 py-3 rounded-lg
                bg-gradient-to-r from-indigo-600 to-teal-500
                hover:from-indigo-700 hover:to-teal-600 transition-colors"
          >
            Xem tất cả tin tức
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsPostClient;
