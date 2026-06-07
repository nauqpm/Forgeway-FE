export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizeClasses[size]} border-4 border-[#EAEAEA] dark:border-white/10 border-t-[#2563EB] dark:border-t-[#3B82F6] rounded-full animate-spin`} />
    </div>
  );
}
