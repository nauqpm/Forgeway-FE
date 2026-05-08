// components/AboutCoreValuesClient.jsx
"use client";
import React from "react";
import { FaEye, FaBullseye, FaStar } from "react-icons/fa";

const cards = [
  {
    id: 1,
    title: "Tầm nhìn",
    Icon: FaEye,
    delay: 100,
    list: [
      "Công ty có văn hóa chuẩn chất;",
      "Công ty dịch vụ BĐS số 1 tại khu vực Miền Nam;",
      "Top 5 nhà kinh doanh BĐS tại Việt Nam.",
    ],
  },
  {
    id: 2,
    title: "Sứ mệnh",
    Icon: FaBullseye,
    delay: 200,
    desc: "Cung cấp sản phẩm và dịch vụ ưu việt, nâng cao giá trị cuộc sống cho con người",
  },
  {
    id: 3,
    title: "Giá trị cốt lõi",
    Icon: FaStar,
    delay: 300,
    desc: "Khát vọng – Chuyên nghiệp – Chính trực – Nhân văn",
  },
];

const AboutCoreValuesClient = () => (
  <section
    id="gia-tri"
    className="w-full py-8 sm:py-12 md:py-16"
    data-aos="fade-up"
  >
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* heading */}
      <h2 className="relative pb-3 mb-6 sm:mb-10 text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
        Tầm nhìn - Sứ mệnh - Giá trị cốt lõi
        <span className="absolute left-0 bottom-0 w-20 h-1 bg-gradient-to-r from-primary to-secondary" />
      </h2>

      {/* grid: 1 col mobile | 3 col iPad & PC */}
      <div className=" grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {cards.map(({ id, title, Icon, delay, list, desc }) => (
          <article
            key={id}
            className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl
                       transition-all duration-300 hover:-translate-y-2 group"
            data-aos="fade-up"
            data-aos-delay={delay}
          >
            {/* icon + title */}
            <header className="flex items-center mb-4">
              <span
                className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full
                               flex items-center justify-center group-hover:bg-primary/20 transition-colors"
              >
                <Icon className="text-primary text-lg sm:text-xl" />
              </span>
              <h3 className="ml-4 text-lg sm:text-xl font-bold text-primary">
                {title}
              </h3>
            </header>

            {/* content */}
            {list ? (
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
                {list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 text-sm sm:text-base">{desc}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default AboutCoreValuesClient;
