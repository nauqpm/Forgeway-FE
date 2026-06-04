'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { inviteService, InviteDetails } from '@/modules/client/workspaces/services/inviteService';
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

  // Auto-redirect when invite was already accepted (e.g. register flow — processPostRegisterInvites accepted it before user lands here)
  useEffect(() => {
    if (
      invite?.status === 'accepted' &&
      invite.type !== 'link' &&
      isAuthenticated &&
      invite.invitedEmail &&
      user?.email.toLowerCase() === invite.invitedEmail.toLowerCase()
    ) {
      router.replace(`/workspaces/${invite.workspaceKey}`);
    }
  }, [invite, isAuthenticated, user, router]);

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
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not accept the invitation.');
    } finally {
      setAccepting(false);
    }
  };

  if (loadingInvite || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid invitation</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{fetchError}</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const isExpiredOrUsed = invite.status !== 'pending';
  const isLinkInvite = invite.type === 'link';
  const emailMismatch =
    !isLinkInvite &&
    isAuthenticated &&
    !!invite.invitedEmail &&
    user?.email.toLowerCase() !== invite.invitedEmail.toLowerCase();
  const expiresText = invite.expiresAt
    ? new Date(invite.expiresAt).toLocaleString('en-US')
    : null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Joined successfully!</h1>
          <p className="text-gray-500 dark:text-gray-400">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{invite.workspaceName}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{invite.workspaceKey}</p>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
          <span className="font-semibold">{invite.invitedBy?.fullName || invite.invitedBy?.email}</span>{' '}
          invited you to join as{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{invite.role}</span>.
        </p>
        {isLinkInvite ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Anyone with this link can join as {invite.role}
            {expiresText ? ` until ${expiresText}` : ''}.
          </p>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            Sent to: {invite.invitedEmail}
            {expiresText ? ` · Expires: ${expiresText}` : ''}
          </p>
        )}

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
                ? 'Sign in or create an account to accept this invitation.'
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
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {accepting ? 'Processing...' : 'Accept invitation'}
              </button>
            ) : (
              <>
                <Link
                  href={`/login?callbackUrl=/invites/accept/${token}`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Sign in to accept
                </Link>
                <Link
                  href={`/register?callbackUrl=/invites/accept/${token}`}
                  className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
