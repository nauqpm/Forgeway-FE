import { X } from "lucide-react";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-[4px] border border-[#2563EB]/20 bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)] px-2 text-[0.6875rem] font-medium text-[#1F6C9F] dark:text-[#93C5FD] transition-colors hover:bg-[#DBEAFE] dark:hover:bg-[rgba(37,99,235,0.2)]"
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" />
    </button>
  );
}
