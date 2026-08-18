"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/modules/auth/shared/hooks/useAuth";
import { useAppProfile } from "@/modules/profile/hooks/useAppProfile";
import { ChangePasswordForm } from "@/modules/profile/components/ChangePasswordForm";
import logoIcon from "../../icon.png";
import { AUTH_ROUTES } from "@/modules/auth/shared/constants/auth-routes";
import { ChangePasswordPayload } from "@/modules/profile/types/profile.types";

function ForceChangePasswordWrapper() {
  const { changePassword, saving } = useAppProfile();
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handlePasswordChange = async (payload: ChangePasswordPayload) => {
    const res = await changePassword(payload);
    if (res.success) {
      await refreshUser();
      router.push(AUTH_ROUTES.HOME);
    }
    return res;
  };

  return <ChangePasswordForm saving={saving} onChangePassword={handlePasswordChange} isAuthVariant={true} />;
}

export default function ChangePasswordPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const mustChangePassword = user?.mustChangePassword;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(AUTH_ROUTES.LOGIN);
      } else if (!mustChangePassword) {
        router.replace(AUTH_ROUTES.DASHBOARD);
      }
    }
  }, [isLoading, isAuthenticated, mustChangePassword, router]);

  if (isLoading || !isAuthenticated || !mustChangePassword) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/videos/mixkit-clouds-and-blue-sky-background-2408-full-hd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-slate-900/10 z-10" />

      <div className="w-full max-w-md relative z-20">
        <div className="bg-white/30 backdrop-blur-2xl rounded-[12px] border border-white/30 p-8 md:p-10 transition-all duration-300 hover:border-white/55 shadow-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
              <div className="w-12 h-12 rounded-[8px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <Image src={logoIcon} width={48} height={48} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Đổi mật khẩu bắt buộc</h1>
            <p className="text-gray-800 text-[0.8125rem] mt-2 font-medium">
              Tài khoản của bạn được tạo tạm thời. Vì lý do bảo mật, bạn bắt buộc phải thay đổi mật khẩu trước khi tiếp tục.
            </p>
          </div>

          <ForceChangePasswordWrapper />
        </div>
      </div>
    </div>
  );
}
