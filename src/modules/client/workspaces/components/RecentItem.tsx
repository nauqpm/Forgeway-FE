import { LucideIcon } from "lucide-react";

type RecentItemProps = {
  icon: LucideIcon;
  title: string;
  meta: string;
  tone?: "red" | "gray";
};

export default function RecentItem({ icon: Icon, title, meta, tone = "gray" }: RecentItemProps) {
  return (
    <button
      type="button"
      className="flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
          tone === "red"
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
          {meta}
        </span>
      </span>
    </button>
  );
}
