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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _response = await axios.post(`${API_URL}/register`, { email, password });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return { register, loading, error };
};
