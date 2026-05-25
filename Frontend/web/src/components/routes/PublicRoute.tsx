import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
    children: React.ReactElement;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('accessToken');

    // Если пользователь уже авторизован (есть user или токен), не пускаем его на страницу логина
    if (user || token) {
        const userRole = user?.role || localStorage.getItem('userRole'); // Или откуда ты берешь роль, если контекст еще не успел обновиться

        // Автоматически перенаправляем на нужный дашборд в зависимости от роли
        if (userRole === 'Admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === 'Mentor') {
            return <Navigate to="/mentor/dashboard" replace />;
        } else if (userRole === 'Student') {
            return <Navigate to="/student/dashboard" replace />;
        }
        
        // Дефолтный редирект, если роль пока не определилась
        return <Navigate to="/admin/dashboard" replace />;
    }

    // Если пользователь НЕ авторизован — спокойно показываем страницу логина
    return children;
};

export default PublicRoute;