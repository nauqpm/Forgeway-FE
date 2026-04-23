"use client";
// components/CurrentProjectsClient.tsx

import React from "react";
import Link from "next/link";
import {
  FaMapMarkerAlt,
  FaBuilding,
  FaVectorSquare,
  FaArrowRight,
} from "react-icons/fa";
import { useAllPosts } from "../../post/hooks/usePost";
import { getThumbnailPath } from "@/utils/getThumbnailPath";
import { transformSunEditorHtml } from "@/utils/transformSunEditorHtml";

// Badge màu theo trạng thái giả định (tuỳ ý sửa)
const badgeColor = "from-teal-500 to-cyan-500";

/* ---------- helper hiển thị dòng info ---------- */
type InfoProps = { icon: React.ReactNode; text: string };
function InfoItem({ icon, text }: InfoProps) {
  return (
    <div className="flex items-start mb-2">
      <span className="text-secondary mt-1 mr-2">{icon}</span>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}

/* ---------- component chính ---------- */
const CurrentProjectsClient = () => {
  const { data: posts = [], isLoading, error } = useAllPosts();
  const top12Posts = posts.slice(0, 12);

  return (
    <section className="w-full py-12 md:py-16 bg-gray-100">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <h2
          className="text-2xl md:text-3xl font-bold mb-8 text-center
            bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500"
          data-aos="fade-up"
        >
          BÀI VIẾT MỚI NHẤT
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {top12Posts.map((post, idx) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-custom overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay={150 + idx * 50}
            >
              <Link href={`/${post.slug}`}>
              <div className="relative">
                <img
                  src={getThumbnailPath(post.thumbnail)}
                  alt={post.name}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* <span
                  className={`absolute top-4 left-4 bg-gradient-to-r ${badgeColor} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}
                >
                  Bài viết
                </span> */}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-primary transition-colors line-clamp-2">
                  <div>{post.name}</div>
                </h3>

                {/* <InfoItem icon={<FaMapMarkerAlt />} text={post.author} /> */}
                <InfoItem
                  icon={<FaBuilding />}
                  text={new Date(post.publishedDate).toLocaleDateString(
                    "vi-VN"
                  )}
                />
                <InfoItem
                  icon={<FaVectorSquare />}
                  text={post.category?.main?.[0] || "Chưa phân loại"}
                />

                {/* <div className="mt-2 mb-4 text-sm text-gray-600 line-clamp-3">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: transformSunEditorHtml(post.excerpt),
                    }}
                  />
                </div> */}

                <div className="flex justify-between items-center">
                  <div
                    className="text-primary font-medium hover:text-secondary transition-colors flex items-center"
                  >
                    Chi tiết <FaArrowRight className="ml-2" />
                  </div>
                  <span className="text-sm font-medium text-primary">
                    #{post.slug.slice(0, 6)}
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

export default CurrentProjectsClient;
