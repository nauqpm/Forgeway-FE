import VerifyEmailForm from '@/modules/auth/register/components/VerifyEmailForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Verify Email',
  description: 'Verify your email account',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
