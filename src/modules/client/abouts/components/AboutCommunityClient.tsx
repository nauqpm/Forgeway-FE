// components/CommunityClient.jsx
"use client";
import React from "react";
import { FaHandsHelping, FaHeart, FaHandshake } from "react-icons/fa";

const stats = [
  { value: "50+", label: "Chương trình" },
  { value: "1000+", label: "Gia đình" },
  { value: "5000+", label: "Người hưởng lợi" },
];

const items = [
  {
    id: 1,
    title: "Ban Công Tác Xã Hội",
    icon: FaHandsHelping,
    desc: "Đức Hòa đã thành lập Ban công tác xã hội, Quỹ từ thiện riêng để kịp thời chia sẻ khó khăn với những hoàn cảnh kém may mắn.",
  },
  {
    id: 2,
    title: "Đồng Hành Cùng Cộng Đồng",
    icon: FaHeart,
    desc: "Mỗi thành viên Đức Hòa luôn ý thức sâu sắc trách nhiệm sẻ chia với cộng đồng bằng hành động thiết thực.",
  },
  {
    id: 3,
    title: "Hợp Tác Vì Cộng Đồng",
    icon: FaHandshake,
    desc: "Đồng hành cùng các cơ quan đoàn thể mang lại hạnh phúc ấm no cho người dân gặp khó khăn trên cả nước.",
  },
];

const AboutCommunityClient = () => (
  <section
    className="w-full py-8 sm:py-12 md:py-16 bg-white"
    data-aos="fade-up"
  >
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* heading */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-3 sm:mb-4">
          Cộng Đồng
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Gắn kết với cộng đồng, vì cộng đồng và sẻ chia thành công là nét văn
          hóa đẹp của Đức Hòa.
        </p>
      </div>

      {/* grid left | right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* image + stats */}
        <div className="relative rounded-xl overflow-hidden shadow-lg">
          <img
            src="/img/congdong.jpg"
            alt="Cộng đồng"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-white">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                    {value}
                  </div>
                  <div className="text-xs sm:text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* content list */}
        <div className="space-y-4 sm:space-y-6">
          {items.map(({ id, title, icon: Icon, desc }) => (
            <div
              key={id}
              className="bg-gray-50 p-4 sm:p-6 rounded-xl flex items-start space-x-3 sm:space-x-4"
            >
              <span className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="text-primary text-lg sm:text-xl" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default AboutCommunityClient;
