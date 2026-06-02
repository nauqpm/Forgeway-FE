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
              A project management platform that helps teams work with more clarity,
              track progress better, and complete work on time.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Product
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
              Company
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
              Get updates
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-6 mb-4">
              Follow new features and practical project management tips.
            </p>

            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Send
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