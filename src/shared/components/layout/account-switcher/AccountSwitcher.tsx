'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Repeat, Trash2, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/modules/auth/shared/hooks/useAuth';
import { useAccountSwitcherStore } from '@/stores/account-switcher.store';
import SwitchAccountConfirmDialog from './SwitchAccountConfirmDialog';

interface AccountSwitcherListProps {
  open: boolean;
  hasFetched: boolean;
  setHasFetched: (value: boolean) => void;
  onCloseMenu?: () => void;
}

const buildRenewHref = (
  targetUserId: string,
  provider: 'password' | 'google',
) =>
  `/login?intent=switch-renew&targetUserId=${encodeURIComponent(targetUserId)}&provider=${provider}`;

export default function AccountSwitcher({
  open,
  hasFetched,
  setHasFetched,
  onCloseMenu,
}: AccountSwitcherListProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const accounts = useAccountSwitcherStore((state) => state.accounts);
  const isLoading = useAccountSwitcherStore((state) => state.isLoading);
  const isSwitching = useAccountSwitcherStore((state) => state.isSwitching);
  const error = useAccountSwitcherStore((state) => state.error);
  const [pending, setPending] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && !hasFetched && !isLoading) {
      setHasFetched(true);
      void useAccountSwitcherStore.getState().fetch();
    }
  }, [open, hasFetched, isLoading, setHasFetched]);

  if (authLoading || !isAuthenticated || !open) return null;

  const handleRowClick = (account: (typeof accounts)[number]) => {
    if (account.isCurrent) return;

    if (account.status === 'expired') {
      onCloseMenu?.();
      router.push(buildRenewHref(account.userId, account.provider));
      return;
    }

    setPending({ id: account.userId, name: account.displayName });
  };

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9B9A97] dark:text-[#6B6B6B]">
          <Repeat className="h-3 w-3" />
          Accounts on this browser
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto pb-1">
        {isLoading && (
          <div className="px-3 py-3 text-[11px] text-[#9B9A97] dark:text-[#6B6B6B]">
            Loading...
          </div>
        )}

        {!isLoading && accounts.length === 0 && (
          <div className="px-3 py-4 text-center">
            <UserCircle2 className="mx-auto h-6 w-6 text-[#ABABAB] dark:text-[#6B6B6B]" />
            <p className="mt-1.5 text-[11px] text-[#787774] dark:text-[#9B9A97]">
              No other accounts on this browser yet.
            </p>
          </div>
        )}

        {!isLoading &&
          accounts.map((account) => {
            const expired = account.status === 'expired';

            return (
              <div
                key={account.userId}
                className={`group flex items-center gap-2 px-2.5 py-1.5 transition ${
                  account.isCurrent
                    ? 'bg-[#EFF6FF] dark:bg-indigo-500/10'
                    : expired
                      ? 'bg-[#FAFAFA] dark:bg-white/[0.03]'
                      : 'hover:bg-[#F7F6F3] dark:hover:bg-white/5'
                }`}
              >
                <button
                  type="button"
                  disabled={isSwitching || account.isCurrent}
                  onClick={() => handleRowClick(account)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2563EB] text-[11px] font-semibold text-white dark:bg-[#3B82F6]">
                    {account.avatarUrl ? (
                      <img
                        src={account.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      account.displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-[#111111] dark:text-[#E8E8E7]">
                      {account.displayName}
                    </p>
                    <p className="truncate text-[10px] text-[#9B9A97] dark:text-[#6B6B6B]">
                      {account.maskedEmail}
                      {account.isCurrent && ' · current'}
                      {!account.isCurrent && expired && ' · expired'}
                    </p>
                  </div>

                  {expired && (
                    <Lock className="h-3.5 w-3.5 text-[#B45309] dark:text-amber-400" />
                  )}
                  {account.isCurrent && (
                    <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8] dark:bg-indigo-500/15 dark:text-indigo-300">
                      Current
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void useAccountSwitcherStore
                      .getState()
                      .forget(account.userId)
                      .catch(() => undefined);
                  }}
                  title="Forget on this browser"
                  className="rounded-md p-1 text-[#ABABAB] opacity-0 transition hover:bg-[#FDEBEC] hover:text-[#9F2F2D] group-hover:opacity-100 dark:text-[#6B6B6B] dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
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
        Sign in with another account
      </a>

      <SwitchAccountConfirmDialog
        open={Boolean(pending)}
        accountName={pending?.name ?? ''}
        isSubmitting={isSwitching}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          void useAccountSwitcherStore
            .getState()
            .switchTo(pending.id)
            .catch(() => undefined);
        }}
      />
    </div>
  );
}
