// CarouselClient.jsx
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [
  {
    src: "/imgs/banner/bg_home.jpg",
    title: "Bất động sản Đức Hòa",
    desc: "Nhà phát triển bất động sản hàng đầu Việt Nam",
  },
  {
    src: "/imgs/banner/bg_home.jpg",
    title: "Dự Án Nổi Bật",
    desc: "Khám phá các dự án bất động sản cao cấp của chúng tôi",
  },
  {
    src: "/imgs/banner/bg_home.jpg",
    title: "Dịch Vụ Chuyên Nghiệp",
    desc: "Đồng hành cùng khách hàng trong mọi nhu cầu bất động sản",
  },
];

const CarouselClient = () => (
  <section className="relative overflow-hidden" data-aos="fade-down">
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      loop
      /* 🖥️ h-60vh mobile → 70vh md → 80vh lg */
      className="w-full h-[60vh] md:h-[70vh] lg:h-[80vh]"
      id="heroSwiper"
    >
      {slides.map((s, i) => (
        <SwiperSlide key={i} className="h-full">
          <div className="relative h-full">
            {/* Image */}
            <img
              src={s.src}
              alt={s.title}
              className="w-full h-full object-cover object-center"
            />
            {/* Dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />

            {/* Overlay content – luôn center XY */}
            <div className="absolute inset-0 grid place-items-center">
              <div
                className="max-w-xl text-white text-center px-4 drop-shadow-lg"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
                  {s.title}
                </h1>
                <p className="text-base md:text-lg lg:text-xl mb-3 md:mb-6 text-white/90">
                  {s.desc}
                </p>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </section>
);

export default CarouselClient;
