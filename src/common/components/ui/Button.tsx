"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] dark:bg-[#3B82F6] dark:text-white dark:hover:bg-[#2563EB]",
  secondary:
    "bg-[#F9F9F8] text-[#111111] border border-[#EAEAEA] hover:bg-[#F0F0EE] active:scale-[0.98] dark:bg-[#252525] dark:text-[#E8E8E7] dark:border-white/10 dark:hover:bg-[#2E2E2E]",
  danger:
    "bg-[#FDEBEC] text-[#9F2F2D] border border-[#F5C6C7] hover:bg-[#FADDDE] active:scale-[0.98] dark:bg-[rgba(159,47,45,0.15)] dark:text-[#E07B79] dark:border-[rgba(159,47,45,0.3)] dark:hover:bg-[rgba(159,47,45,0.22)]",
  ghost:
    "bg-transparent text-[#787774] hover:bg-[#F7F6F3] active:scale-[0.98] dark:text-[#9B9A97] dark:hover:bg-white/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[0.6875rem] rounded-[4px] gap-1.5",
  md: "h-8 px-3 text-[0.8125rem] rounded-[6px] gap-2",
  lg: "h-9 px-4 text-[0.8125rem] rounded-[6px] gap-2",
};

const iconSizeClasses: Record<Size, string> = {
  sm: "[&_svg]:w-3 [&_svg]:h-3",
  md: "[&_svg]:w-3.5 [&_svg]:h-3.5",
  lg: "[&_svg]:w-4 [&_svg]:h-4",
};

const Spinner = ({ size }: { size: Size }) => {
  const dim = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <svg
      className={`${dim} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center font-medium select-none",
          "transition-all duration-150",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          iconSizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <Spinner size={size} />
        ) : (
          icon && iconPosition === "left" && icon
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, Variant as ButtonVariant, Size as ButtonSize };
