import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "AL-SDLC Platform - Streamlined software development lifecycle management",
};

export default function AboutPage() {
  return (
    <div className="app-page-narrow py-12">
      <h1 className="mb-8 text-3xl font-bold text-[#111111] dark:text-[#E8E8E7]">
        About AL-SDLC
      </h1>

      <div className="space-y-8">
        <section className="rounded-[12px] border border-[#EAEAEA] bg-white p-6 dark:border-white/[0.06] dark:bg-[#252525]">
          <h2 className="mb-4 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Our Mission
          </h2>
          <p className="text-[#787774] dark:text-[#9B9A97]">
            AL-SDLC is a comprehensive platform designed to streamline the entire software
            development lifecycle. From project planning and sprint management to task
            tracking and team collaboration, we help development teams deliver better software
            faster.
          </p>
        </section>

        <section className="rounded-[12px] border border-[#EAEAEA] bg-white p-6 dark:border-white/[0.06] dark:bg-[#252525]">
          <h2 className="mb-4 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Key Features
          </h2>
          <ul className="space-y-3 text-[#787774] dark:text-[#9B9A97]">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span>Project and workspace management with role-based access control</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span>Sprint planning and backlog management</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span>Task tracking with Kanban boards</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span>Document collaboration and wiki pages</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span>SSO authentication and enterprise security</span>
            </li>
          </ul>
        </section>

        <section className="rounded-[12px] border border-[#EAEAEA] bg-white p-6 dark:border-white/[0.06] dark:bg-[#252525]">
          <h2 className="mb-4 text-xl font-semibold text-[#111111] dark:text-[#E8E8E7]">
            Tech Stack
          </h2>
          <p className="text-[#787774] dark:text-[#9B9A97]">
            Built with Next.js 14, TypeScript, TailwindCSS, and modern development practices
            for a fast, reliable, and scalable experience.
          </p>
        </section>
      </div>
    </div>
  );
}
