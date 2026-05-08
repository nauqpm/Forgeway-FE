import AuthGuard from "./guards/AuthGuard";
import { useAuth } from "./repositories/authRepository";

interface AuthDTO {
    email: string;
    password: string;
}

const attachTokenToHeaders = (token: string) => {
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const AuthModule = {
    DTO: {} as AuthDTO,  // 🟢 Cách sửa: Sử dụng casting `{}` thành `AuthDTO`
    Guard: AuthGuard,
    Repository: useAuth,
    TokenStrategy: attachTokenToHeaders,
};
