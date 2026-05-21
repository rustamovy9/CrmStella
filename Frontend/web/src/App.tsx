import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Импорт страниц авторизации
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Импорт панелей ролей
import AdminDashboard from './pages/admin/AdminDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Открытые маршруты */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    
                    {/* Закрытые маршруты с проверкой ролей */}
                    {/* Важно: /* в пути позволяет создавать внутренние подстраницы в будущем */}
                    <Route path="/admin/*" element={
                        <ProtectedRoute allowedRoles={['Admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/mentor/*" element={
                        <ProtectedRoute allowedRoles={['Mentor']}>
                            <MentorDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/student/*" element={
                        <ProtectedRoute allowedRoles={['Student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Перенаправление по умолчанию */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;