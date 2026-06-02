import ClientLayout from "@/modules/client/common/layout/ClientLayout";
import Link from "next/link";

export default function LandingPage() {
  return (
    <ClientLayout>
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          Modern project management tool
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
          Project management
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">without limits</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          AL-TASK helps your team collaborate more effectively with Kanban boards, sprint planning, and real-time progress tracking.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors">
            Try for free
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
