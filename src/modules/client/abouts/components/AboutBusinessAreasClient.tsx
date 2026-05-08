// components/BusinessAreasClient.jsx
"use client";
import React from "react";

const areas = [
  {
    id: 1,
    title: "Xây dựng",
    img: "/img/xaydungg.jpg",
    desc: "Thắng Lợi không ngừng phát triển hoạt động đầu tư xây dựng để nhanh chóng trở thành một trong những tập đoàn phát triển bất động sản hàng đầu Việt Nam.",
    delay: 100,
  },
  {
    id: 2,
    title: "Đầu tư tài chính",
    img: "/img/taichinh.jpg",
    desc: "Trải qua chặng đường 14 năm, Thắng Lợi trở thành một trong những chủ đầu tư ghi dấu ấn với danh mục sản phẩm đa dạng, đáp ứng nhu cầu thị trường.",
    delay: 200,
  },
  {
    id: 3,
    title: "Bất động sản",
    img: "/img/batdongsan.jpg",
    desc: "Song song xây dựng, Thắng Lợi tập trung phát triển, kinh doanh bất động sản ở nhiều phân khúc, tạo nên giá trị bền vững cho khách hàng và cộng đồng.",
    delay: 300,
  },
];

const AboutBusinessAreasClient = () => (
  <section className="w-full py-8 sm:py-12 md:py-16" data-aos="fade-up">
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* heading */}
      <h2 className="relative pb-3 mb-6 sm:mb-10 text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
        Lĩnh vực hoạt động
        <span className="absolute left-0 bottom-0 w-20 h-1 bg-gradient-to-r from-primary to-secondary" />
      </h2>

      {/* grid: 1 | 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {areas.map(({ id, title, img, desc, delay }) => (
          <article
            key={id}
            className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            data-aos="fade-up"
            data-aos-delay={delay}
          >
            <div className="h-40 sm:h-52 overflow-hidden">
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            <div className="bg-primary text-white p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                {title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base">{desc}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default AboutBusinessAreasClient;
