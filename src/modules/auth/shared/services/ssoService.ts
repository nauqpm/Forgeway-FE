import api from "@/lib/axiosIns";
import { GetExchangeCodeRequest, GetExchangeCodeResponse } from "../types/auth.types";

export const exchangeCode = async (request: GetExchangeCodeRequest) => {
    const res = await api.post<GetExchangeCodeResponse>('/auth/sso/code', request);
    return res.data;
}