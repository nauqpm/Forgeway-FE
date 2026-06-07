import Link from "next/link";

const productLinks = [
  { label: "Features", href: "#" },
  { label: "Kanban Board", href: "#" },
  { label: "Sprint Planning", href: "#" },
  { label: "Track progress", href: "#" },
];

const companyLinks = [
  { label: "About", href: "/aboutUs" },
  { label: "Contact", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Careers", href: "#" },
];

const legalLinks = [
  { label: "Terms", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Cookies", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center">
                <span className="text-white font-bold text-sm">AL</span>
              </div>
              <span className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">
                AL-TASK
              </span>
            </Link>

            <p className="text-[13px] text-[#787774] dark:text-[#9B9A97] leading-6">
              A project management platform that helps teams work with more clarity,
              track progress better, and complete work on time.
            </p>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-[#787774] dark:text-[#9B9A97] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[#111111] dark:text-[#E8E8E7] mb-4">
              Get updates
            </h3>
            <p className="text-[13px] text-[#787774] dark:text-[#9B9A97] leading-6 mb-4">
              Follow new features and practical project management tips.
            </p>

            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-[6px] border border-[#EAEAEA] dark:border-white/8 bg-white dark:bg-[#202020] px-3 py-2 text-[13px] text-[#111111] dark:text-[#E8E8E7] placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              />
              <button
                type="submit"
                className="rounded-[6px] bg-[#2563EB] dark:bg-[#3B82F6] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#EAEAEA] dark:border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[#ABABAB] dark:text-[#6B6B6B]">
            &copy; {new Date().getFullYear()} AL-TASK. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            {legalLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[13px] text-[#ABABAB] dark:text-[#6B6B6B] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
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