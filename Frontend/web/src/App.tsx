import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import PublicRoute from './components/routes/PublicRoute'; 

// Импорт обертки для сайдбара
import MainLayout from './components/MainLayout'; 

// Импорт страниц авторизации
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Импорт панелей ролей
import AdminDashboard from './pages/admin/dashboard/AdminDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import LeadsPage from './pages/admin/users/LeadsPage';
import StudentsPage from './pages/admin/users/StudentsPage';
import MentorsPage from './pages/admin/users/MentorsPage';

// Импорт страниц блока "Пользователи" из твоего Сайдбара

// Импорт остальных страниц (добавь по мере готовности)
// import CoursesPage from './pages/admin/CoursesPage';
// import PaymentsPage from './pages/admin/PaymentsPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* ================= ОТКРЫТЫЕ МАРШРУТЫ ================= */}
                    <Route path="/login" element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } />
                    <Route path="/forgot-password" element={
                        <PublicRoute>
                            <ForgotPassword />
                        </PublicRoute>
                    } />
                    
                    {/* ================= ЗАКРЫТЫЕ МАРШРУТЫ АДМИНИСТРАТОРА ================= */}
                    <Route path="/admin/*" element={
                        <ProtectedRoute allowedRoles={['Admin']}>
                            <MainLayout role="Admin">
                                <Routes>
                                    {/* Авто-редирект с базового /admin на дашборд */}
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    
                                    {/* Главная панель */}
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    
                                    {/* БЛОК "ПОЛЬЗОВАТЕЛИ" (Сверяем пути с Sidebar.tsx) */}
                                    <Route path="leads" element={<LeadsPage />} />
                                    <Route path="students" element={<StudentsPage />} />
                                    <Route path="mentors" element={<MentorsPage />} />
                                    
                                    {/* Будущие страницы для блока "Учебный процесс", "Финансы" и т.д. */}
                                    {/* <Route path="courses" element={<CoursesPage />} /> */}
                                    {/* <Route path="payments" element={<PaymentsPage />} /> */}
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* ================= ЗАКРЫТЫЕ МАРШРУТЫ МЕНТОРА ================= */}
                    <Route path="/mentor/*" element={
                        <ProtectedRoute allowedRoles={['Mentor']}>
                            <MainLayout role="Mentor">
                                <Routes>
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    <Route path="dashboard" element={<MentorDashboard />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* ================= ЗАКРЫТЫЕ МАРШРУТЫ СТУДЕНТА ================= */}
                    <Route path="/student/*" element={
                        <ProtectedRoute allowedRoles={['Student']}>
                            <MainLayout role="Student">
                                <Routes>
                                    <Route index element={<Navigate to="dashboard" replace />} />
                                    <Route path="dashboard" element={<StudentDashboard />} />
                                </Routes>
                            </MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* ================= УМНЫЙ РЕДИРЕКТ ДЛЯ ОШИБОЧНЫХ URL ================= */}
                    <Route path="/" element={
                        <PublicRoute>
                            <Navigate to="/login" replace />
                        </PublicRoute>
                    } />
                    <Route path="*" element={
                        <PublicRoute>
                            <Navigate to="/login" replace />
                        </PublicRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;