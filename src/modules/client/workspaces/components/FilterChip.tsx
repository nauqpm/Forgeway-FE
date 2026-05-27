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
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" />
    </button>
  );
}
