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
      className="inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" />
    </button>
  );
}
