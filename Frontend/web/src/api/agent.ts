import axios from 'axios';
import type { ApiResult, AuthResponse } from '../types/auth';

const agent = axios.create({
    baseURL: 'http://localhost:5046/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Перехватчик запросов: добавляет Access Token в каждый Header
agent.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Перехватчик ответов: авто-обновление токена при ошибке 401
agent.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');

                // Делаем запрос на обновление токена
                const res = await axios.post<ApiResult<AuthResponse>>('https://localhost:7001/api/auth/refresh', {
                    refreshToken,
                });

                if (res.data.isSuccess) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                    localStorage.setItem('token', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return agent(originalRequest); // Повторяем упавший запрос
                }
            } catch (refreshError) {
                // Если рефреш-токен тоже сдох — разлогиниваем
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default agent;