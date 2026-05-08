"use client";
// components/FeaturedProjects.tsx

import React from "react";
import Link from "next/link";
import { useAllPosts } from "../../post/hooks/usePost";
import { getThumbnailPath } from "@/utils/getThumbnailPath";
import { transformSunEditorHtml } from "@/utils/transformSunEditorHtml";

/**
 * 🏗️ OutstandingProjectClient (dự án nổi bật)
 * - Hiển thị 12 bài viết mới nhất (giả định là nổi bật)
 * - Responsive grid: 1 | 3 | 4
 */
const OutstandingProjectClient = () => {
  const { data: posts = [], isLoading, error } = useAllPosts();
  const top12 = posts.slice(0, 6);

  return (
    <section className="w-full py-16 px-3 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto">
        <h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500"
          data-aos="zoom-in"
          data-aos-duration="800"
        >
          DỰ ÁN NỔI BẬT
        </h2>

        {isLoading && (
          <div className="text-center text-gray-500 py-10">
            Đang tải dữ liệu...
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 py-10">
            Lỗi: {(error as Error).message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {top12.map((p, idx) => (
            <div
              key={p._id}
              className="group relative bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={200 + idx * 100}
            >
              <Link href={`/${p.slug}`}>
              <div className="relative">
                <img
                  src={getThumbnailPath(p.thumbnail)}
                  alt={p.name}
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* <div className="absolute top-4 left-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                  Bài viết
                </div> */}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  <div>{p.name}</div>
                </h3>

                {/* <div className="flex items-center text-gray-600 mb-3 text-sm">
                  <i className="fas fa-map-marker-alt text-teal-500 mr-2" />
                  <span>{p.author}</span>
                </div> */}

                {/* <p className="text-gray-700 mb-4 line-clamp-2 leading-relaxed text-sm">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: transformSunEditorHtml(p.excerpt),
                    }}
                  />
                </p> */}

                <div className="flex justify-between items-center">
                  <div
                    className="flex items-center text-indigo-600 font-semibold hover:text-teal-500 transition-colors text-sm"
                  >
                    Chi tiết{" "}
                    <i className="fas fa-arrow-right ml-2 transform transition-transform group-hover:translate-x-1" />
                  </div>
                  <span className="text-sm font-medium text-indigo-600">
                    {new Date(p.publishedDate).toLocaleDateString("vi-VN")}
                  </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OutstandingProjectClient;
