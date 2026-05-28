import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Upload, Layers, Users,
    Clock, BarChart3, CheckCircle, AlertCircle
} from 'lucide-react';
import courseService from '../../../api/courseService';

const BASE_URL = 'http://localhost:5046';

const CourseInfoPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Состояния данных
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [uploadingIcon, setUploadingIcon] = useState<boolean>(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Состояния для полей формы
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [durationWeeks, setDurationWeeks] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    // Статистика (только чтение)
    const [stats, setStats] = useState({ groupsCount: 0, activeGroupsCount: 0, totalStudentsCount: 0 });

    // Загрузка данных курса при старте
    useEffect(() => {
        if (id) {
            fetchCourseData();
        }
    }, [id]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const res = await courseService.getById(Number(id));

            // В обертках ApiResult чистые данные модели обычно лежат 
            // либо в res.data.data, либо сам res.data является объектом с полем data.
            // Приведение к 'as any' уберёт ругань TypeScript.
            const apiResult = res.data as any;

            // Проверяем: если внутри ApiResult есть поле data/result, берем его, иначе берем сам объект
            const courseData = apiResult?.data || apiResult?.result || apiResult;

            if (courseData) {
                setName(courseData.name || '');
                setDescription(courseData.description || '');
                setPrice(courseData.price || 0);
                setDurationWeeks(courseData.durationWeeks || 0);
                setIsActive(courseData.isActive || false);

                setStats({
                    groupsCount: courseData.groupsCount || 0,
                    activeGroupsCount: courseData.activeGroupsCount || 0,
                    totalStudentsCount: courseData.totalStudentsCount || 0
                });

                // Формируем корректный путь к аватару
                if (courseData.iconUrl) {
                    if (courseData.iconUrl.startsWith('http')) {
                        setIconUrl(courseData.iconUrl);
                    } else {
                        const cleanPath = courseData.iconUrl.startsWith('/')
                            ? courseData.iconUrl.replace(/^\/+/, '/')
                            : `/${courseData.iconUrl}`;
                        setIconUrl(`${BASE_URL}${cleanPath}`);
                    }
                } else {
                    setIconUrl(null);
                }
            }
        } catch (err) {
            console.error("Ошибка загрузки:", err);
            showNotice('Не удалось загрузить данные курса', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotice = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    // Сохранение текстовых данных
    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await courseService.update(Number(id), {
                name,
                description,
                price: Number(price),
                durationWeeks: Number(durationWeeks)
            });
            showNotice('Данные курса успешно обновлены', 'success');
        } catch (err) {
            showNotice('Ошибка при сохранении изменений', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Изменение статуса курса
    const handleStatusToggle = async () => {
        const nextStatus = !isActive;
        try {
            await courseService.setStatus(Number(id), nextStatus);
            setIsActive(nextStatus);
            showNotice(`Статус курса изменен на: ${nextStatus ? 'Активен' : 'Заморожен'}`, 'success');
        } catch (err) {
            showNotice('Не удалось изменить статус курса', 'error');
        }
    };

    // Загрузка новой иконки курса
    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setUploadingIcon(true);
                const res = await courseService.updateIcon(Number(id), file);

                // Исправлено: забираем данные строго из ответа .data
                const updatedData = res.data;

                if (updatedData && updatedData.iconUrl) {
                    const cleanPath = updatedData.iconUrl.startsWith('/')
                        ? updatedData.iconUrl.replace(/^\/+/, '/')
                        : `/${updatedData.iconUrl}`;
                    setIconUrl(`${BASE_URL}${cleanPath}`);
                }
                showNotice('Аватар курса успешно обновлен', 'success');
            } catch (err) {
                showNotice('Не удалось загрузить аватар', 'error');
            } finally {
                setUploadingIcon(false);
            }
        }
    };

    if (loading) {
        return (
            <div style={styles.centeredState}>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <div className="spinner" style={styles.spinner} />
                <p style={styles.loadingText}>Загрузка информации о курсе...</p>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {/* Хедер страницы */}
            <div style={styles.headerRow}>
                <button style={styles.backButton} onClick={() => navigate('/admin/courses')}>
                    <ArrowLeft size={18} />
                    Назад к списку
                </button>
                <div style={styles.headerTitleBlock}>
                    <h2 style={styles.pageTitle}>Управление курсом #{id}</h2>
                    <p style={styles.pageSubtitle}>Редактирование параметров, медиафайлов и текущей статистики</p>
                </div>
            </div>

            {/* Уведомления */}
            {message && (
                <div style={{
                    ...styles.notice,
                    backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                    borderColor: message.type === 'success' ? '#BBF7D0' : '#FCA5A5',
                    color: message.type === 'success' ? '#166534' : '#991B1B'
                }}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div style={styles.mainGrid}>
                {/* ЛЕВАЯ КОЛОНКА: Форма редактирования */}
                <div style={styles.leftColumn}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Основная информация</h3>
                        <form onSubmit={handleSaveChanges} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Название направления</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={styles.input}
                                    required
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Описание курса</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={styles.textarea}
                                    placeholder="Введите детальное описание направления..."
                                />
                            </div>

                            <div style={styles.rowGrid}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Стоимость (TJS)</label>
                                    <div style={styles.inputIconWrapper}>
                                        <BarChart3 size={16} style={styles.inputIcon} />
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            style={styles.inputWithIcon}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Длительность (недель)</label>
                                    <div style={styles.inputIconWrapper}>
                                        <Clock size={16} style={styles.inputIcon} />
                                        <input
                                            type="number"
                                            value={durationWeeks}
                                            onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                            style={styles.inputWithIcon}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    ...styles.submitButton,
                                    opacity: submitting ? 0.7 : 1
                                }}
                            >
                                <Save size={16} style={{ marginRight: '8px' }} />
                                {submitting ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ПРАВАЯ КОЛОНКА: Аватарка, Статус и Статистика */}
                <div style={styles.rightColumn}>
                    {/* Блок Аватарки */}
                    <div style={styles.cardCentered}>
                        <h3 style={styles.cardTitle}>Аватар курса</h3>
                        <div style={styles.avatarContainer}>
                            <div style={styles.bigAvatar}>
                                {iconUrl ? (
                                    <img src={iconUrl} alt="Course Avatar" style={styles.avatarImg} />
                                ) : (
                                    <span style={styles.avatarFallback}>{name ? name.charAt(0).toUpperCase() : 'C'}</span>
                                )}
                                {uploadingIcon && (
                                    <div style={styles.avatarOverlay}>
                                        <div className="spinner" style={{ ...styles.spinner, width: '20px', height: '20px' }} />
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleIconChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                style={styles.uploadButton}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingIcon}
                            >
                                <Upload size={14} style={{ marginRight: '6px' }} />
                                Изменить фото
                            </button>
                        </div>
                    </div>

                    {/* Управление Статусом */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Статус видимости</h3>
                        <div style={styles.statusControlRow}>
                            <div>
                                <div style={styles.statusIndicator}>
                                    <div style={{ ...styles.statusDot, backgroundColor: isActive ? '#10B981' : '#F59E0B' }} />
                                    <span style={styles.statusText}>{isActive ? 'Курс активен' : 'Курс заморожен'}</span>
                                </div>
                                <p style={styles.statusDescription}>Замороженные курсы скрыты из общего расписания</p>
                            </div>

                            <label style={styles.switch}>
                                <input type="checkbox" checked={isActive} onChange={handleStatusToggle} style={styles.switchInput} />
                                <span style={{ ...styles.slider, backgroundColor: isActive ? '#10B981' : '#CBD5E1' }}>
                                    <span style={{ ...styles.sliderCircle, transform: isActive ? 'translateX(16px)' : 'translateX(0px)' }} />
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Статистика */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Текущие показатели</h3>
                        <div style={styles.statsList}>
                            <div style={styles.statItem}>
                                <div style={styles.statLeft}>
                                    <Layers size={16} color="#4F46E5" />
                                    <span style={styles.statLabel}>Всего групп:</span>
                                </div>
                                <strong style={styles.statValue}>{stats.groupsCount}</strong>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statLeft}>
                                    <CheckCircle size={16} color="#10B981" />
                                    <span style={styles.statLabel}>Активных групп:</span>
                                </div>
                                <strong style={styles.statValue}>{stats.activeGroupsCount}</strong>
                            </div>
                            <div style={styles.statItem}>
                                <div style={styles.statLeft}>
                                    <Users size={16} color="#06B6D4" />
                                    <span style={styles.statLabel}>Активных студентов:</span>
                                </div>
                                <strong style={styles.statValue}>{stats.totalStudentsCount}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Стили оставляем без изменений
const styles = {
    pageContainer: { padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F8FAFC', minHeight: '100vh' },
    headerRow: { display: 'flex', flexDirection: 'column' as const, gap: '16px', marginBottom: '28px' },
    backButton: { display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#64748B', padding: '8px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.2s' },
    headerTitleBlock: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
    pageTitle: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#0F172A' },
    pageSubtitle: { margin: 0, fontSize: '14px', color: '#64748B' },
    notice: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '12px', border: '1px solid', marginBottom: '24px', fontSize: '14px', fontWeight: 500 },
    mainGrid: { display: 'flex', gap: '32px', flexWrap: 'wrap' as const },
    leftColumn: { flex: '2 1 600px', display: 'flex', flexDirection: 'column' as const, gap: '24px' },
    rightColumn: { flex: '1 1 350px', display: 'flex', flexDirection: 'column' as const, gap: '24px' },
    card: { background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' },
    cardCentered: { background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
    cardTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', width: '100%' },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px', flex: 1 },
    label: { fontSize: '13px', fontWeight: 600, color: '#475569' },
    input: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', outline: 'none', transition: 'border 0.2s' },
    textarea: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', minHeight: '120px', outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit' },
    rowGrid: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
    inputIconWrapper: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute' as const, left: '12px', color: '#94A3B8' },
    inputWithIcon: { padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', color: '#1E293B', width: '100%', boxSizing: 'border-box' as const },
    submitButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' },
    avatarContainer: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '16px', marginTop: '10px' },
    bigAvatar: { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#4F46E5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', fontWeight: 700, position: 'relative' as const, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)' },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' as const },
    avatarOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    uploadButton: { display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    avatarFallback: { lineHeight: 1 },
    statusControlRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statusIndicator: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
    statusText: { fontSize: '14px', fontWeight: 600, color: '#1E293B' },
    statusDescription: { margin: 0, fontSize: '12px', color: '#64748B' },
    switch: { position: 'relative' as const, display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer', flexShrink: 0 },
    switchInput: { opacity: 0, width: 0, height: 0 },
    slider: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', transition: '0.2s', display: 'flex', alignItems: 'center', padding: '0 3px' },
    sliderCircle: { height: '16px', width: '16px', borderRadius: '50%', backgroundColor: 'white', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' },
    statsList: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
    statItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px' },
    statLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    statLabel: { fontSize: '13px', fontWeight: 500, color: '#475569' },
    statValue: { fontSize: '14px', fontWeight: 700, color: '#0F172A' },
    centeredState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' },
    loadingText: { fontSize: '14px', color: '#64748B', fontWeight: 500 },
    spinner: { border: '3px solid #E2E8F0', borderTop: '3px solid #4F46E5', borderRadius: '50%', width: '32px', height: '32px' }
};

export default CourseInfoPage;