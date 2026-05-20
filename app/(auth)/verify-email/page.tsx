import VerifyEmailForm from '@/modules/auth/register/components/VerifyEmailForm';
import { Suspense } from 'react';

export const metadata = {
  title: 'Xác thực Email - AL-TASK',
  description: 'Xác thực tài khoản email của bạn',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
