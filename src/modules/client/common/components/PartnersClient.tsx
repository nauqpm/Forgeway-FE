"use client";
// components/PartnersCarouselClient.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

/* ------------ partners list ------------ */
const partners = [
  { src: "/img/logoi/logo-vietcom-1.png", alt: "Vietcombank" },
  { src: "/img/logoi/logo-KCN-HaI-SON-3.png", alt: "KCN Hải Sơn" },
  { src: "/img/logoi/logo-viettin-1.png", alt: "VietinBank" },
  { src: "/img/logoi/1.jpg", alt: "An Cường", whiteBg: true },
  { src: "/img/logoi/Logo-HD-Bank-1.png", alt: "HDBank" },
];

/* ------------ component ------------ */
const PartnersCarouselClient = () => (
  <section className="w-full bg-gray-100 py-16">
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 text-center">
      {/* heading */}
      <h2
        className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent
                   bg-gradient-to-r from-indigo-600 to-teal-500"
        data-aos="fade-up"
      >
        ĐỐI TÁC CỦA CHÚNG TÔI
      </h2>
      <div className="w-16 h-1 bg-yellow-500 mx-auto mt-3 mb-4" />
      <p className="text-gray-600 text-lg">
        Những đối tác đã tin tưởng và hợp tác cùng Đức Hòa
      </p>

      {/* carousel: 1 | 3 | 4 logos/slide */}
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        loop
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 12 },
          640: { slidesPerView: 3, spaceBetween: 24 }, // iPad ≥640 px
          1024: { slidesPerView: 4, spaceBetween: 32 }, // PC ≥1024 px
        }}
        className="mt-8"
      >
        {partners.map((p) => (
          <SwiperSlide key={p.alt} className="flex justify-center">
            <img
              src={p.src}
              alt={p.alt}
              className={`max-h-16 object-contain ${
                p.whiteBg ? "bg-white p-2 rounded-lg shadow" : ""
              }`}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </section>
);

export default PartnersCarouselClient;
