'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/shared/hooks/useAuth';
import { inviteService, InviteDetails } from '@/modules/workspace/shared/services/inviteService';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle, Building2, UserPlus } from 'lucide-react';

interface Props {
  token: string;
}

export default function AcceptInvitePage({ token }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    inviteService.getInviteByToken(token)
      .then(setInvite)
      .catch(() => setFetchError('This invitation does not exist or has expired.'))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const isLinkInvite = invite?.type === 'link';

  // Auto-redirect when already a member (email invite accepted via register flow)
  useEffect(() => {
    if (
      invite?.status === 'accepted' &&
      isAuthenticated &&
      !isLinkInvite &&
      user?.email.toLowerCase() === (invite.invitedEmail ?? '').toLowerCase()
    ) {
      router.replace(`/workspaces/${invite.workspaceKey}`);
    }
  }, [invite, isAuthenticated, user, router, isLinkInvite]);

  // Auto-accept link invites when authenticated
  useEffect(() => {
    if (isLinkInvite && isAuthenticated && invite?.status === 'pending' && !accepting && !done) {
      handleAccept();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkInvite, isAuthenticated, invite?.status]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const workspaceKey = invite?.workspaceKey;
      if (!workspaceKey) {
        toast.error('Could not identify the invitation workspace.');
        return;
      }

      await inviteService.acceptInvite(token);
      setDone(true);
      toast.success('You have joined the workspace successfully!');
      setTimeout(() => router.push(`/workspaces/${workspaceKey}`), 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const status = e?.response?.status;
      const workspaceKey = invite?.workspaceKey;
      if (status === 409 && workspaceKey) {
        toast.success('You are already a member of this workspace.');
        setTimeout(() => router.push(`/workspaces/${workspaceKey}`), 1500);
        setDone(true);
        return;
      }
      toast.error(e?.response?.data?.message || 'Could not accept the invitation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loadingInvite || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] dark:text-[#3B82F6]" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A] p-4">
        <div className="bg-white dark:bg-[#202020] rounded-[10px] p-8 max-w-md w-full text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-2">Invalid invitation</h1>
          <p className="text-[#787774] dark:text-[#9B9A97] mb-6">{fetchError}</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] text-[0.8125rem] font-medium hover:bg-[#1D4ED8] transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const isExpiredOrUsed = invite.status !== 'pending';
  const emailMismatch = !isLinkInvite && isAuthenticated && !!invite.invitedEmail &&
    user?.email.toLowerCase() !== invite.invitedEmail.toLowerCase();

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A] p-4">
        <div className="bg-white dark:bg-[#202020] rounded-[10px] p-8 max-w-md w-full text-center" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#111111] dark:text-[#E8E8E7] mb-2">Joined successfully!</h1>
          <p className="text-[#787774] dark:text-[#9B9A97]">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#1A1A1A] p-4">
      <div className="bg-white dark:bg-[#202020] rounded-[10px] p-8 max-w-md w-full" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-[8px] bg-[#2563EB] dark:bg-[#3B82F6] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111111] dark:text-[#E8E8E7]">{invite.workspaceName}</h1>
            <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B]">{invite.workspaceKey}</p>
          </div>
        </div>

        <p className="text-[#111111] dark:text-[#E8E8E7] text-[0.8125rem] mb-1">
          <span className="font-semibold">{invite.invitedBy?.fullName || invite.invitedBy?.email}</span>{' '}
          invited you to join as{' '}
          <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6]">{invite.role}</span>.
        </p>
        <p className="text-xs text-[#ABABAB] dark:text-[#6B6B6B] mb-6">
          {invite.invitedEmail ? `Sent to: ${invite.invitedEmail}` : 'Open invite link'}
          {invite.expiresAt ? ` · Expires: ${new Date(invite.expiresAt).toLocaleDateString('en-US')}` : ''}
        </p>

        {isExpiredOrUsed && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This invitation has {invite.status === 'accepted' ? 'been accepted' : 'expired or been canceled'}.
            </p>
          </div>
        )}

        {!isExpiredOrUsed && emailMismatch && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg mb-4">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              This invitation is for {invite.invitedEmail}. You are signed in as {user?.email}.
            </p>
          </div>
        )}

        {!isExpiredOrUsed && !isAuthenticated && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isLinkInvite
                ? 'Sign in or create an account to join this workspace.'
                : `Sign in or create an account with ${invite.invitedEmail} to accept this invitation.`}
            </p>
          </div>
        )}

        {!isExpiredOrUsed && !emailMismatch && (
          <div className="space-y-3">
            {isAuthenticated ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
              >
                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {accepting ? 'Processing...' : 'Accept invitation'}
              </button>
            ) : (
              <>
                <Link
                  href={`/login?callbackUrl=/invites/accept/${token}`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] dark:bg-[#3B82F6] text-white rounded-[6px] font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Sign in to accept
                </Link>
                <Link
                  href={`/register?callbackUrl=/invites/accept/${token}`}
                  className="w-full flex items-center justify-center px-6 py-3 border border-[#EAEAEA] dark:border-white/10 text-[#111111] dark:text-[#E8E8E7] rounded-[6px] font-semibold hover:bg-[#F7F6F3] dark:hover:bg-white/5 transition-colors"
                >
                  Create new account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
