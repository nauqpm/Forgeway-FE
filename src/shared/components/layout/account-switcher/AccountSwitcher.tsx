"use client";

import { useEffect, useMemo } from "react";
import { LogIn, Repeat, UserCircle2, X } from "lucide-react";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useAccountSwitcherStore } from "@/stores/account-switcher.store";
import type { SavedAccount } from "@/modules/auth/services/account-switcher.service";

function fmtTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

interface AccountSwitcherListProps {
  /** Whether the list is currently visible. The parent owns the toggle. */
  open: boolean;
  /** Whether the API has been hit at least once in this component instance. */
  hasFetched: boolean;
  setHasFetched: (v: boolean) => void;
  /** Close the surrounding menu (e.g. after navigating to /login). */
  onCloseMenu?: () => void;
}

interface MergedAccount {
  account: SavedAccount;
  /** true nếu row đến từ saved (owner-scoped) — có metadata audit đầy đủ. */
  isSaved: boolean;
}

/**
 * Gộp 2 nguồn: saved (owner-scoped) + recent (device-scoped).
 * Ưu tiên row saved (có metadata audit); chỉ thêm recent khi accountId chưa có
 * trong saved. Sắp xếp: nhóm saved trước, sau đó lastUsedAt desc trong từng nhóm.
 */
function mergeAccounts(
  saved: SavedAccount[],
  recent: SavedAccount[],
): MergedAccount[] {
  const byId = new Map<string, MergedAccount>();
  for (const a of saved) {
    byId.set(a.accountId, { account: a, isSaved: true });
  }
  for (const a of recent) {
    if (byId.has(a.accountId)) continue; // dedup — saved thắng
    byId.set(a.accountId, { account: a, isSaved: false });
  }
  return Array.from(byId.values()).sort((a, b) => {
    if (a.isSaved !== b.isSaved) return a.isSaved ? -1 : 1;
    const ta = new Date(a.account.lastUsedAt).getTime() || 0;
    const tb = new Date(b.account.lastUsedAt).getTime() || 0;
    return tb - ta;
  });
}

/**
 * The saved-account list. No own trigger button — the parent avatar menu renders
 * the toggle icon in its header. This keeps the list from being a nested dropdown
 * that overflows a narrow parent panel.
 */
export default function AccountSwitcherList({
  open,
  hasFetched,
  setHasFetched,
  onCloseMenu,
}: AccountSwitcherListProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const accounts = useAccountSwitcherStore((s) => s.accounts);
  const recentAccounts = useAccountSwitcherStore((s) => s.recentAccounts);
  const isLoading = useAccountSwitcherStore((s) => s.isLoading);
  const isSwitching = useAccountSwitcherStore((s) => s.isSwitching);
  const error = useAccountSwitcherStore((s) => s.error);

  // Lazy-load on first open. Use getState() — subscribing to the `fetch` action
  // would put this effect in an infinite loop (Zustand returns a new ref each render).
  useEffect(() => {
    if (open && !hasFetched && !isLoading) {
      setHasFetched(true);
      void useAccountSwitcherStore.getState().fetch();
    }
  }, [open, hasFetched, isLoading, setHasFetched]);

  const merged = useMemo(
    () => mergeAccounts(accounts, recentAccounts),
    [accounts, recentAccounts],
  );

  if (authLoading || !isAuthenticated) return null;

  const handleSwitch = async (accountId: string) => {
    try {
      await useAccountSwitcherStore.getState().switchTo(accountId);
    } catch {
      // Error already in store
    }
  };

  const handleForget = async (
    e: React.MouseEvent<HTMLButtonElement>,
    accountId: string,
    isSaved: boolean,
  ) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await useAccountSwitcherStore.getState().forget(accountId);
      } else {
        await useAccountSwitcherStore.getState().forgetRecent(accountId);
      }
    } catch {
      // Error already in store
    }
  };

  if (!open) return null;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">
          <Repeat className="h-3 w-3" />
          Account trên thiết bị này
        </p>
      </div>

      <div className="max-h-56 overflow-y-auto pb-1">
        {isLoading && (
          <div className="px-3 py-3 text-[11px] text-[#9B9A97] dark:text-[#6B6B6B]">
            Đang tải…
          </div>
        )}

        {!isLoading && merged.length === 0 && (
          <div className="px-3 py-4 text-center">
            <UserCircle2 className="mx-auto h-6 w-6 text-[#ABABAB] dark:text-[#6B6B6B]" />
            <p className="mt-1.5 text-[11px] text-[#787774] dark:text-[#9B9A97]">
              Chưa có account nào khác.
            </p>
            <p className="mt-0.5 text-[10px] text-[#9B9A97] dark:text-[#6B6B6B]">
              Đăng nhập account khác trên thiết bị này — chúng sẽ tự xuất hiện ở đây.
            </p>
          </div>
        )}

        {!isLoading &&
          merged.map(({ account: acc, isSaved }) => {
            const isCurrent = user?.email === acc.email;
            return (
              <div
                key={`${isSaved ? "saved" : "recent"}:${acc.accountId}`}
                className={`group flex items-center gap-2 px-2.5 py-1.5 transition ${
                  isCurrent
                    ? "bg-[#EFF6FF] dark:bg-indigo-500/10"
                    : "hover:bg-[#F7F6F3] dark:hover:bg-white/5"
                }`}
              >
                <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2563EB] text-[11px] font-semibold text-white dark:bg-[#3B82F6]">
                  {acc.avatar ? (
                    <img
                      src={acc.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (acc.fullName ?? acc.email).charAt(0).toUpperCase()
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSwitching || isCurrent}
                  onClick={() => handleSwitch(acc.accountId)}
                  className="min-w-0 flex-1 text-left disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <p className="truncate text-[12.5px] font-medium text-[#111111] dark:text-[#E8E8E7]">
                    {acc.fullName ?? acc.email}
                  </p>
                  <p className="truncate text-[10px] text-[#9B9A97] dark:text-[#6B6B6B]">
                    {acc.email}
                    {isCurrent && " · hiện tại"}
                    {!isCurrent && ` · ${fmtTime(acc.lastUsedAt)}`}
                  </p>
                </button>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={(e) => handleForget(e, acc.accountId, isSaved)}
                    title="Xoá khỏi danh sách"
                    className="rounded-md p-1 text-[#ABABAB] opacity-0 transition hover:bg-[#FDEBEC] hover:text-[#9F2F2D] group-hover:opacity-100 dark:text-[#6B6B6B] dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {error && (
        <div className="px-3 py-2 text-[10px] text-[#9F2F2D] dark:text-red-400">
          {error}
        </div>
      )}

      <a
        href="/login"
        onClick={() => onCloseMenu?.()}
        className="flex items-center justify-center gap-1.5 border-t border-[#EAEAEA] px-3 py-2 text-[11px] font-medium text-[#2563EB] transition hover:bg-[#EFF6FF] dark:border-white/[0.06] dark:text-indigo-300 dark:hover:bg-indigo-500/10"
      >
        <LogIn className="h-3.5 w-3.5" />
        Đăng nhập bằng account khác
      </a>
    </div>
  );
}
