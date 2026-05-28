import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserInfo } from '../types/auth';
import agent from '../api/agent';

interface AuthContextType {
    user: UserInfo | null;
    login: (user: UserInfo, token: string, refreshToken: string) => void;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        // ✅ Проверяем все три — user, token и refreshToken
        if (storedUser && token && refreshToken) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                // ✅ Если JSON сломан — чистим
                localStorage.clear();
                setUser(null);
            }
        } else {
            localStorage.clear();
            setUser(null);
        }

        setLoading(false);
    }, []);

    const login = (userInfo: UserInfo, token: string, refreshToken: string) => {
        setUser(userInfo);
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
    };

    // ✅ Logout теперь async — вызывает бэкенд
    const logout = async () => {
        try {
            await agent.post('/auth/logout');
        } catch {
            // Игнорируем ошибку — всё равно выходим
        } finally {
            setUser(null);
            localStorage.clear();
        }
    };

    // ✅ Синхронизация между вкладками
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'token' && !e.newValue) {
                // Токен удалён в другой вкладке — выходим везде
                setUser(null);
            }
            if (e.key === 'user' && e.newValue) {
                // Пользователь обновлён в другой вкладке
                try {
                    setUser(JSON.parse(e.newValue));
                } catch {
                    setUser(null);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};