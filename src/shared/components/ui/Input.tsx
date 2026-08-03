"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useId } from "react";

// ── Base classes shared by all input types ───────────────────────────────────
const baseInputClasses = [
  "w-full px-3 text-[0.8125rem] font-normal",
  "bg-white dark:bg-[#252525]",
  "text-[#111111] dark:text-[#E8E8E7]",
  "placeholder:text-[#ABABAB] dark:placeholder:text-[#6B6B6B]",
  "border border-[#EAEAEA] dark:border-white/10",
  "rounded-[6px]",
  "outline-none",
  "transition-colors duration-150",
  "focus:border-[#111111] dark:focus:border-white/30",
  "disabled:opacity-40 disabled:cursor-not-allowed",
].join(" ");

// ── Wrapper with label + error ────────────────────────────────────────────────
interface FieldWrapperProps {
  controlId?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ controlId, label, hint, error, required, children, className = "" }: FieldWrapperProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={controlId} className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[#787774] dark:text-[#9B9A97]">
          {label}
          {required && <span className="ml-0.5 text-[#9F2F2D]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[0.6875rem] text-[#9F2F2D]">{error}</p>
      ) : hint ? (
        <p className="text-[0.6875rem] text-[#ABABAB] dark:text-[#6B6B6B]">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Text Input ────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, wrapperClassName, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const hasError = Boolean(error);

    const input = (
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-2.5 flex items-center text-[#ABABAB] dark:text-[#6B6B6B] [&_svg]:w-3.5 [&_svg]:h-3.5 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={controlId}
          ref={ref}
          className={[
            baseInputClasses,
            "h-8",
            leftIcon ? "pl-8" : "",
            rightIcon ? "pr-8" : "",
            hasError ? "border-[#9F2F2D] focus:border-[#9F2F2D]" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-2.5 flex items-center text-[#ABABAB] dark:text-[#6B6B6B] [&_svg]:w-3.5 [&_svg]:h-3.5">
            {rightIcon}
          </span>
        )}
      </div>
    );

    if (!label && !hint && !error) return input;

    return (
      <FieldWrapper
        controlId={controlId}
        label={label}
        hint={hint}
        error={error}
        required={props.required}
        className={wrapperClassName}
      >
        {input}
      </FieldWrapper>
    );
  }
);

Input.displayName = "Input";

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, wrapperClassName, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const hasError = Boolean(error);

    const textarea = (
      <textarea
        id={controlId}
        ref={ref}
        className={[
          baseInputClasses,
          "py-2 resize-none min-h-20",
          hasError ? "border-[#9F2F2D] focus:border-[#9F2F2D]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    );

    if (!label && !hint && !error) return textarea;

    return (
      <FieldWrapper
        controlId={controlId}
        label={label}
        hint={hint}
        error={error}
        required={props.required}
        className={wrapperClassName}
      >
        {textarea}
      </FieldWrapper>
    );
  }
);

Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, wrapperClassName, className = "", children, id, ...props }, ref) => {
    const generatedId = useId();
    const controlId = id ?? generatedId;
    const hasError = Boolean(error);

    const select = (
      <select
        id={controlId}
        ref={ref}
        className={[
          baseInputClasses,
          "h-8 cursor-pointer appearance-none pr-8",
          "bg-[image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ABABAB' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center]",
          hasError ? "border-[#9F2F2D] focus:border-[#9F2F2D]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </select>
    );

    if (!label && !hint && !error) return select;

    return (
      <FieldWrapper
        controlId={controlId}
        label={label}
        hint={hint}
        error={error}
        required={props.required}
        className={wrapperClassName}
      >
        {select}
      </FieldWrapper>
    );
  }
);

Select.displayName = "Select";

export { Input, Textarea, Select, FieldWrapper };
export type { InputProps, TextareaProps, SelectProps };
