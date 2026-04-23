// components/PhilosophyClient.jsx
"use client";
import React from "react";

const AboutPhilosophyClient = () => (
  <section
    id="triet-ly"
    className="w-full relative my-8 sm:my-12 md:my-16 py-12 sm:py-16 md:py-20 rounded-xl overflow-hidden"
    data-aos="fade-up"
  >
    {/* background image */}
    <img
      src="/img/BANNER.jpg"
      alt="Triết lý kinh doanh"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-110"
    />
    {/* dark gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

    {/* content container */}
    <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6">
      <div className="text-center text-white max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-6 text-yellow-400 drop-shadow-lg">
          Triết lý kinh doanh
        </h2>
        <p
          className="text-lg sm:text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto
                       bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 text-transparent bg-clip-text"
        >
          Chúng tôi xây dựng niềm tin bắt đầu từ xây dựng ngôi nhà của bạn
        </p>
      </div>
    </div>
  </section>
);

export default AboutPhilosophyClient;
