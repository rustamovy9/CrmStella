import axios from 'axios';
import type { ApiResult, AuthResponse } from '../types/auth';

const agent = axios.create({
    baseURL: 'http://localhost:5046/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Функция для безопасного разлогина и редиректа
const handleForceLogout = () => {
    localStorage.clear();
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// Перехватчик запросов: добавляет Access Token в каждый Header
agent.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Перехватчик ответов: авто-обновление токена и редирект при 401
agent.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 1. Если получили 401 и это первая попытка запроса (не ретри)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                handleForceLogout();
                return Promise.reject(error);
            }

            try {
                // ИССПРАВЛЕНО: Теперь порт совпадает с твоим бэкендом (5046)
                const res = await axios.post<ApiResult<AuthResponse>>('http://localhost:5046/api/auth/refresh', {
                    refreshToken,
                });

                if (res.data.isSuccess) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
                    localStorage.setItem('token', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return agent(originalRequest); // Повторяем запрос с новым токеном
                }
            } catch (refreshError) {
                // Если рефреш-токен тоже сдох или сервер недоступен — выкидываем
                handleForceLogout();
                return Promise.reject(refreshError);
            }
        }

        // 2. Если это уже был повторный запрос (после рефреша) и он ВСЕ РАВНО вернул 401
        if (error.response?.status === 401) {
            handleForceLogout();
        }

        return Promise.reject(error);
    }
);

export default agent;