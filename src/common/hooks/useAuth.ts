// src/hooks/useAuth.ts
import { useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const register = async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/register`, { email, password });
            console.log("Đăng ký thành công:", response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Đã có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    return { register, loading, error };
};
