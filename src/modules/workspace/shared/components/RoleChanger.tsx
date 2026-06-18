"use client";

import { ChevronDown, Eye, Loader2, ShieldCheck, Users } from "lucide-react";
import type { ComponentType, CSSProperties, SVGProps } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type WorkspaceRoleValue = "workspace_admin" | "member" | "viewer";

type RoleOption = {
  value: WorkspaceRoleValue;
  label: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: string;
};

export const WORKSPACE_ROLE_OPTIONS: RoleOption[] = [
  {
    value: "workspace_admin",
    label: "Admin",
    description: "Manage workspace",
    Icon: ShieldCheck,
    tone:
      "bg-[#E1F3FE] text-[#1F6C9F] border-[#B9DDF3] dark:bg-[rgba(31,108,159,0.18)] dark:text-[#93C5FD] dark:border-[#1F6C9F]/35",
  },
  {
    value: "member",
    label: "Member",
    description: "Edit work",
    Icon: Users,
    tone:
      "bg-[#EDF3EC] text-[#346538] border-[#C8DDC6] dark:bg-[rgba(52,101,56,0.18)] dark:text-[#86EFAC] dark:border-[#346538]/35",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read only",
    Icon: Eye,
    tone:
      "bg-[#F7F6F3] text-[#787774] border-[#EAEAEA] dark:bg-[#252525] dark:text-[#B8B7B3] dark:border-white/[0.08]",
  },
];

type RoleChangerProps = {
  value: WorkspaceRoleValue;
  onChange: (role: WorkspaceRoleValue) => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  compact?: boolean;
  className?: string;
};

export default function RoleChanger({
  value,
  onChange,
  disabled = false,
  isLoading = false,
  label = "Role",
  compact = false,
  className = "",
}: RoleChangerProps) {
  const isDisabled = disabled || isLoading;
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedRole =
    WORKSPACE_ROLE_OPTIONS.find((role) => role.value === value) ??
    WORKSPACE_ROLE_OPTIONS[1];
  const SelectedIcon = selectedRole.Icon;

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 240;
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding,
    );

    setMenuStyle({
      left,
      position: "fixed",
      top: rect.bottom + 6,
      width: menuWidth,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isDisabled) setIsOpen(false);
  }, [isDisabled]);

  return (
    <div ref={rootRef} className={"relative " + className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#787774] dark:text-[#9B9A97]">
          {label}
        </span>
        {isLoading && (
          <span className="text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
            Updating
          </span>
        )}
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
        onClick={() => setIsOpen((current) => !current)}
        className={
          "flex h-10 w-full items-center justify-between gap-3 rounded-[8px] border border-[#EAEAEA] bg-white px-3 text-left text-[#111111] transition-colors hover:bg-[#F9F9F8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#252525] dark:text-[#E8E8E7] dark:hover:bg-[#2E2E2E] " +
          (compact ? "min-w-[9rem]" : "min-w-[15rem]")
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px] border " +
              selectedRole.tone
            }
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <SelectedIcon className="h-3.5 w-3.5" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.8125rem] font-semibold leading-4">
              {selectedRole.label}
            </span>
            {!compact && (
              <span className="block truncate text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                {selectedRole.description}
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          className={
            "h-3.5 w-3.5 flex-shrink-0 text-[#ABABAB] transition-transform " +
            (isOpen ? "rotate-180" : "")
          }
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="z-[9999] overflow-hidden rounded-[8px] border border-[#EAEAEA] bg-white p-1 dark:border-white/[0.08] dark:bg-[#202020]"
          style={{
            ...menuStyle,
            boxShadow:
              "0 12px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          {WORKSPACE_ROLE_OPTIONS.map((role) => {
            const selected = value === role.value;
            const Icon = role.Icon;

            return (
              <div
                key={role.value}
                className="border-b border-[#EAEAEA] py-1 last:border-b-0 dark:border-white/[0.06]"
              >
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    if (!selected) onChange(role.value);
                    setIsOpen(false);
                  }}
                  className={
                    "flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left transition-colors hover:bg-[#F7F6F3] dark:hover:bg-[#2E2E2E] " +
                    (selected
                      ? "bg-[#F9F9F8] text-[#111111] dark:bg-[#252525] dark:text-[#E8E8E7]"
                      : "text-[#787774] dark:text-[#9B9A97]")
                  }
                >
                  <span
                    className={
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] border " +
                      role.tone
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.8125rem] font-semibold leading-4">
                      {role.label}
                    </span>
                    <span className="block text-[0.6875rem] font-medium text-[#787774] dark:text-[#9B9A97]">
                      {role.description}
                    </span>
                  </span>
                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-[#E8E8E7]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
