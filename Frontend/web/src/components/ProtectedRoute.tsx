import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactElement;
    allowedRoles: string[]; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    // Убираем isLoading, если контекст его не поставляет, 
    // и берем токен напрямую для синхронной проверки
    const { user } = useAuth();
    const token = localStorage.getItem('accessToken'); 

    // Если нет ни пользователя в контексте, ни токена в системе — сразу на вход
    if (!user && !token) {
        return <Navigate to="/login" replace />;
    }

    // Если пользователь загрузился, но его роль не совпадает с разрешенными
    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    // Если всё совпало — рендерим панель
    return children;
};

export default ProtectedRoute;