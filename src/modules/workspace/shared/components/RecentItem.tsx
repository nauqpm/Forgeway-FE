import { LucideIcon } from "lucide-react";

type RecentItemProps = {
  icon: LucideIcon;
  title: string;
  meta: string;
  tone?: "red" | "gray";
  onClick?: () => void;
};

export default function RecentItem({ icon: Icon, title, meta, tone = "gray", onClick }: RecentItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 items-center gap-3 rounded-[6px] px-2 py-2 text-left transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E]"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] ${
          tone === "red"
            ? "bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] text-[#2563EB] dark:text-[#3B82F6]"
            : "bg-[#F7F6F3] dark:bg-[#252525] text-[#787774] dark:text-[#9B9A97]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.8125rem] font-medium text-[#111111] dark:text-[#E8E8E7]">
          {title}
        </span>
        <span className="block truncate text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">
          {meta}
        </span>
      </span>
    </button>
  );
}
