import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5512';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        config.withCredentials = true;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;
            try {
                await api.post('/auth/refresh', {});
                return api(originalRequest);
            } catch {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('workspace-storage');
                    window.location.href = '/login';
                }
            }
        } else if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('workspace-storage');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
