import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import agent from '../../api/agent';
import { useAuth } from '../../context/AuthContext';
import type { ApiResult, AuthResponse } from '../../types/auth';
import Logo from '../../components/ui/Logo';

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await agent.post<ApiResult<AuthResponse>>('/auth/login', { email, password });
            const result = response.data;

            if (result.isSuccess) {
                login(result.data.user, result.data.accessToken, result.data.refreshToken);
                const userRole = result.data.user.role;

                if (userRole === 'Admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (userRole === 'Mentor') {
                    navigate('/mentor/dashboard', { replace: true });
                } else if (userRole === 'Student') {
                    navigate('/student/dashboard', { replace: true });
                } else {
                    setError('Неизвестная роль пользователя.');
                }
            } else {
                setError(result.message || 'Неверный email или пароль');
            }
        } catch (err: any) {
            const serverResponse = err.response?.data as ApiResult<AuthResponse> | undefined;
            setError(serverResponse?.message || 'Ошибка соединения с сервером');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>

            {/* ЛЕВАЯ СТОРОНА: Глубокий градиент с обновленным неоновым логотипом */}
            <div style={styles.leftSide}>
                <div style={styles.overlayGlow}></div>

                {/* Контейнер логотипа — сделали шире, убрали зажимы */}
                <div style={styles.leftHeader}>
                    <Logo width="310px" /> 
                </div>

                {/* Центр левой панели */}
                <div style={styles.leftContent}>
                    <div style={styles.sparkleIcon}>✦</div>
                    <h1 style={styles.leftTitle}>
                        Управляйте обучением <br />в один клик.
                    </h1>
                    <p style={styles.leftSubtitle}>
                        Современная экосистема EduCRM для менторов, студентов и администрации. Отслеживайте баланс, планируйте занятия и ведите аналитику успеваемости в реальном времени.
                    </p>
                </div>

                <footer style={styles.leftFooter}>
                    © {new Date().getFullYear()} EduCRM. Все права защищены.
                </footer>
            </div>

            {/* ПРАВАЯ СТОРОНА: Форма входа */}
            <div style={styles.rightSide}>
                <div style={styles.formWrapper}>

                    <div style={styles.textHeader}>
                        <h2 style={styles.mainTitle}>Вход в систему</h2>
                        <p style={styles.subTitle}>Пожалуйста, введите ваши данные для доступа к платформе</p>
                    </div>

                    {error && (
                        <div style={styles.errorBanner}>
                            <span>✕</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={styles.form}>

                        {/* Поле Email */}
                        <div style={styles.fieldContainer}>
                            <label style={{
                                ...styles.floatingLabel,
                                color: emailFocused || email ? '#1e40af' : '#94a3b8',
                                transform: emailFocused || email ? 'translateY(-22px) scale(0.85)' : 'translateY(0) scale(1)'
                            }}>
                                Email адрес
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    ...styles.premiumInput,
                                    borderColor: emailFocused ? '#1e40af' : '#e2e8f0',
                                    boxShadow: emailFocused ? '0 4px 12px rgba(30,64,175,0.08)' : 'none'
                                }}
                            />
                        </div>

                        {/* Поле Пароля */}
                        <div style={styles.fieldContainer}>
                            <label style={{
                                ...styles.floatingLabel,
                                color: passwordFocused || password ? '#1e40af' : '#94a3b8',
                                transform: passwordFocused || password ? 'translateY(-22px) scale(0.85)' : 'translateY(0) scale(1)'
                            }}>
                                Пароль
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    ...styles.premiumInput,
                                    borderColor: passwordFocused ? '#1e40af' : '#e2e8f0',
                                    boxShadow: passwordFocused ? '0 4px 12px rgba(30,64,175,0.08)' : 'none'
                                }}
                            />
                        </div>

                        {/* Вспомогательная строка */}
                        <div style={styles.actionRow}>
                            <Link to="/forgot-password" style={styles.forgotPass}>
                                Забыли пароль?
                            </Link>
                        </div>

                        {/* Кнопка войти */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={isSubmitting ? { ...styles.submitButton, ...styles.btnDisabled } : styles.submitButton}
                        >
                            {isSubmitting ? 'Вход в систему...' : 'Войти в панель →'}
                        </button>
                    </form>

                    <div style={styles.rightFooter}>
                        Нет доступа? <a href="#support" style={styles.supportLink}>Обратитесь к администратору</a>
                    </div>

                </div>
            </div>

        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        width: '100vw',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        backgroundColor: '#ffffff',
        // Переключили всю страницу на чистый геометрический шрифт Inter
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
    },
    leftSide: {
        flex: '1.1',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        position: 'relative' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        padding: '4rem 4.5rem',
        color: '#ffffff',
        overflow: 'hidden',
    },
    overlayGlow: {
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        background: 'radial-gradient(circle at 80% 20%, rgba(37,99,235,0.25), transparent 50%)',
    },
    leftHeader: {
        position: 'relative' as const,
        zIndex: 2,
        marginLeft: '-24px', // Небольшой сдвиг влево, чтобы компенсировать внутренний padding компонента Logo
    },
    leftContent: {
        position: 'relative' as const,
        zIndex: 2,
        maxWidth: '460px',
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    sparkleIcon: {
        fontSize: '2.5rem',
        color: '#38bdf8',
        marginBottom: '1.5rem',
        lineHeight: 1,
    },
    leftTitle: {
        fontSize: '2.8rem',
        fontWeight: '700' as const,
        lineHeight: '1.2',
        marginBottom: '1.5rem',
        letterSpacing: '-0.02em',
    },
    leftSubtitle: {
        fontSize: '1rem',
        color: '#94a3b8',
        lineHeight: '1.65',
    },
    leftFooter: {
        position: 'relative' as const,
        zIndex: 2,
        fontSize: '0.85rem',
        color: '#475569',
    },
    rightSide: {
        flex: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        backgroundColor: '#ffffff',
    },
    formWrapper: {
        width: '100%',
        maxWidth: '380px',
    },
    textHeader: {
        marginBottom: '3rem',
    },
    mainTitle: {
        fontSize: '2.2rem',
        fontWeight: '800' as const,
        color: '#0f172a',
        letterSpacing: '-0.02em',
        marginBottom: '0.5rem',
    },
    subTitle: {
        fontSize: '0.95rem',
        color: '#64748b',
        lineHeight: '1.4',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2rem',
    },
    fieldContainer: {
        position: 'relative' as const,
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
    },
    floatingLabel: {
        position: 'absolute' as const,
        left: '16px',
        top: '14px',
        fontSize: '0.95rem',
        pointerEvents: 'none' as const,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'top left',
        backgroundColor: '#ffffff',
        padding: '0 4px',
    },
    premiumInput: {
        width: '100%',
        padding: '14px 16px',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '1rem',
        outline: 'none',
        color: '#0f172a',
        boxSizing: 'border-box' as const,
        transition: 'all 0.2s ease',
    },
    actionRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        fontSize: '0.85rem',
        marginTop: '-0.5rem',
    },
    forgotPass: {
        color: '#1e40af',
        textDecoration: 'none',
        fontWeight: '500' as const,
    },
    submitButton: {
        width: '100%',
        padding: '1rem',
        backgroundColor: '#1e40af',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600' as const,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(30,64,175,0.2)',
        transition: 'all 0.2s ease',
    },
    btnDisabled: {
        backgroundColor: '#94a3b8',
        boxShadow: 'none',
        cursor: 'not-allowed',
    },
    rightFooter: {
        textAlign: 'center' as const,
        marginTop: '3rem',
        fontSize: '0.9rem',
        color: '#64748b',
    },
    supportLink: {
        color: '#0f172a',
        fontWeight: '600' as const,
        textDecoration: 'none',
    },
    errorBanner: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fee2e2',
        color: '#b91c1c',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        marginBottom: '1.5rem',
    }
};

export default Login;