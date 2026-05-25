import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserInfo } from '../types/auth';

interface AuthContextType {
    user: UserInfo | null;
    login: (user: UserInfo, token: string, refreshToken: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // Проверяем связку: должен быть и юзер, и его рабочий токен
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        } else {
            // Если чего-то не хватает — чистим кэш, это неавторизованный вход
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

    const logout = () => {
        setUser(null);
        localStorage.clear();
    };

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