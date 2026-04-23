import React from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  // FaFacebookF,
  // FaYoutube,
  // FaTwitter,
  // FaInstagram,
} from "react-icons/fa";

const ContactClient = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto p-4">
        {/* Page Title & Description */}
        <div data-aos="fade-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-4">
            LIÊN HỆ
          </h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            Quý khách vui lòng liên hệ với chúng tôi để được hỗ trợ và giải đáp
            chi tiết. Thắng Lợi Miền Nam luôn sẵn sàng hỗ trợ Quý khách.
          </p>
        </div>

        {/* Contact Info & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 md:mb-12">
          {/* Info */}
          <div
            className="bg-white rounded-lg shadow-custom p-5 sm:p-6"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            <h2 className="text-lg sm:text-xl font-bold text-primary mb-4 pb-2 border-b border-gray-200">
              THÔNG TIN LIÊN HỆ
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 font-semibold">
                  TRỤ SỞ CHÍNH Miền Nam
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  THẮNG LỢI MIỀN NAM - TRỤ SỞ CHÍNH Miền Nam
                </p>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <FaMapMarkerAlt size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">Địa chỉ:</p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    51 Kinh Dương Vương, P.12, Q.6, TP. Hồ Chí Minh
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <FaPhoneAlt size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">Số điện thoại:</p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    0938.605.657
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <FaEnvelope size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-gray-700 font-semibold">Email:</p>
                  <p className="text-gray-600 text-sm sm:text-base">
                    info@thangloimiennam.vn
                  </p>
                </div>
              </div>

              {/* Social Media */}
              {/* <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-700 font-semibold mb-3">
                  Kết nối với chúng tôi:
                </p>
                <div className="flex space-x-3">
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <FaFacebookF size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <FaYoutube size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                  >
                    <FaTwitter size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                  >
                    <FaInstagram size={20} />
                  </a>
                </div>
              </div> */}
            </div>
          </div>

          {/* Google Map */}
          <div data-aos="fade-left" data-aos-delay="200">
            <div className="bg-white rounded-lg shadow-custom p-2 h-full">
              <iframe
                className="w-full h-[300px] sm:h-[400px] lg:h-full rounded-lg"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.447602073974!2d106.68943031480076!3d10.776389392311!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f8ed6c2a0x4c2b1b2b1b2b1b2b!2s27%20%C4%90inh%20B%E1%BB%99%20L%C4%A9nh%2C%20Ph%C6%B0%E1%BB%9Dng%2024%2C%20B%C3%ACnh%20Th%E1%BA%A1nh%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh!5e0!3m2!1sen!2sus!4v1698765432109!5m2!1sen!2sus"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div
          className="bg-gradient-to-r from-primary to-blue-800 rounded-lg shadow-custom overflow-hidden"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <div className="p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              GỬI THÔNG TIN LIÊN HỆ
            </h2>
            <p className="text-white/90 text-sm mb-6">
              Chúng tôi có thể giúp gì cho bạn? Hãy để lại thông tin để chúng
              tôi phục vụ bạn tốt nhất!
            </p>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="full-name"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Họ tên <span className="text-red-300">*</span>
                  </label>
                  <input
                    type="text"
                    id="full-name"
                    placeholder="Nhập họ tên của bạn"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg input-focus bg-white/95 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Email <span className="text-red-300">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Nhập địa chỉ email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg input-focus bg-white/95 text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Điện thoại <span className="text-red-300">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Nhập số điện thoại"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg input-focus bg-white/95 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-white mb-1"
                  >
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    id="subject"
                    placeholder="Nhập tiêu đề"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg input-focus bg-white/95 text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Nội dung <span className="text-red-300">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Nhập nội dung liên hệ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg input-focus bg-white/95 text-gray-800"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-secondary hover:bg-accent text-white font-bold rounded-lg btn-hover flex items-center justify-center"
                >
                  <FaEnvelope className="mr-2" /> Gửi liên hệ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAB for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <a
          href="tel:0283512227"
          className="flex items-center justify-center w-14 h-14 bg-secondary text-white rounded-full shadow-lg animate-pulse"
        >
          <FaPhoneAlt size={24} />
        </a>
      </div>
    </div>
  );
};

export default ContactClient;
