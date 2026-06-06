import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import PublicRoute from './components/routes/PublicRoute';

import MainLayout from './components/ui/bar/MainLayout';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminDashboard from './pages/admin/dashboard/AdminDashboard';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentsPage from './pages/admin/users/StudentsPage';
import MentorsPage from './pages/admin/users/MentorsPage';
import UserInfoPage from './pages/admin/users/UserInfoPage';

import CoursesPage from './pages/admin/education/CoursesPage';
import CourseInfoPage from './pages/admin/education/CourseInfoPage';

import GroupsPage from './pages/admin/education/GroupsPage';
import SchedulePage from './pages/admin/education/SchedulePage';
import GroupDetailsPage from './pages/admin/education/GroupDetailsPage';
import JournalPage from './pages/admin/journal/JournalPage';
import FinanceDashboard from './pages/admin/finance/FinanceDashboard';
import { AnalyticsPage } from './pages/admin/analytic/AnalyticsPage';
import LeadsPage from './pages/admin/leads/LeadsPage';

import ProfilePage from './pages/profile/ProfilePage';

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

                                    {/* БЛОК "ПОЛЬЗОВАТЕЛИ" */}
                                    <Route path="leads" element={<LeadsPage />} />
                                    <Route path="students" element={<StudentsPage />} />
                                    <Route path="mentors" element={<MentorsPage />} />
                                    <Route path="users/:id" element={<UserInfoPage />} />

                                    {/* БЛОК "УЧЕБНЫЙ ПРОЦЕСС" */}
                                    <Route path="courses" element={<CoursesPage />} />
                                    <Route path="courses/:id" element={<CourseInfoPage />} />

                                    {/* БЛОК ГРУПП И ЖУРНАЛА */}
                                    <Route path="groups" element={<GroupsPage />} />
                                    <Route path="groups/:id" element={<GroupDetailsPage />} />
                                    <Route path="groups/:groupId/journal" element={<JournalPage />} />
                                    <Route path="schedules" element={<SchedulePage />} />
                                    <Route path="finance" element={<FinanceDashboard />} />
                                    <Route path="analytics" element={<AnalyticsPage />} />

                                    {/* ПРОФИЛЬ */}
                                    <Route path="profile" element={<ProfilePage />} />
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

                                    {/* Добавили роут сюда, чтобы ментор тоже мог зайти в журнал */}
                                    <Route path="groups/:groupId/journal" element={<JournalPage />} />

                                    {/* ПРОФИЛЬ */}
                                    <Route path="profile" element={<ProfilePage />} />
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

                                    {/* ПРОФИЛЬ */}
                                    <Route path="profile" element={<ProfilePage />} />
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