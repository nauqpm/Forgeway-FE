import { use } from 'react';

export const metadata = { title: 'Accept Invite' };
import AcceptInvitePage from '@/modules/invites/AcceptInvitePage';

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <AcceptInvitePage token={token} />;
}
