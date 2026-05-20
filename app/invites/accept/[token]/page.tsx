import { use } from 'react';
import AcceptInvitePage from '@/modules/client/invites/AcceptInvitePage';

export default function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <AcceptInvitePage token={token} />;
}
