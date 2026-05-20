import Link from "next/link";

const productLinks = [
  { label: "Tính năng", href: "#" },
  { label: "Kanban Board", href: "#" },
  { label: "Sprint Planning", href: "#" },
  { label: "Theo dõi tiến độ", href: "#" },
];

const companyLinks = [
  { label: "Giới thiệu", href: "#" },
  { label: "Liên hệ", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Tuyển dụng", href: "#" },
];

const legalLinks = [
  { label: "Điều khoản", href: "#" },
  { label: "Bảo mật", href: "#" },
  { label: "Cookies", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-indigo-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                AL-TASK
              </span>
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-6">
              Nền tảng quản lý dự án giúp đội ngũ làm việc rõ ràng hơn,
              theo dõi tiến độ tốt hơn và hoàn thành công việc đúng hạn.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Sản phẩm
            </h3>
            <ul className="space-y-3">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Công ty
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Nhận cập nhật
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-6 mb-4">
              Theo dõi những tính năng mới và mẹo quản lý dự án hiệu quả.
            </p>

            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email của bạn"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} AL-TASK. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {legalLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}