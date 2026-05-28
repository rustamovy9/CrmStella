import axios from 'axios';
import type { ApiResult, AuthResponse } from '../types/auth';

const agent = axios.create({
    baseURL: 'http://localhost:5046/api',
    headers: { 'Content-Type': 'application/json' },
});

// ✅ Флаг чтобы избежать гонки запросов при одновременных 401
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    failedQueue = [];
};

const handleForceLogout = () => {
    localStorage.clear();
    isRefreshing = false;
    failedQueue = [];
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// ✅ Interceptor запросов — добавляет токен
agent.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ Interceptor ответов — авто-обновление токена
agent.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Пропускаем если это сам запрос refresh или login
        if (
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/login')
        ) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // ✅ Если уже обновляем токен — ставим запрос в очередь
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return agent(originalRequest);
                }).catch((err) => Promise.reject(err));
            }

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                handleForceLogout();
                return Promise.reject(error);
            }

            isRefreshing = true;

            try {
                const res = await axios.post<ApiResult<AuthResponse>>(
                    'http://localhost:5046/api/auth/refresh',
                    { refreshToken }
                );

                if (res.data.isSuccess && res.data.data) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;

                    // ✅ Сохраняем новые токены
                    localStorage.setItem('token', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    // ✅ Обновляем header для всех ожидающих запросов
                    agent.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    processQueue(null, accessToken);

                    return agent(originalRequest);
                } else {
                    processQueue(new Error('Refresh failed'), null);
                    handleForceLogout();
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                handleForceLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default agent;