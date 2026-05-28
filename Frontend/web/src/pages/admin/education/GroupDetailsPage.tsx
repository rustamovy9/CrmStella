import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Loader2, AlertCircle, X, UserPlus, Info, UserMinus, MessageSquare } from 'lucide-react';
import type { GroupStudentResponse } from '../../../types/groupStudent';
import { ActionCards, type GroupDto } from '../../../components/ui/ActionCards';
import { groupStudentService } from '../../../api/groupStudentService';
import groupService from '../../../api/groupService';
import { StudentTable } from '../../../components/ui/StudentTable';

const GroupDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const groupId = Number(id);
    const navigate = useNavigate();

    // --- СОСТОЯНИЕ ДАННЫХ ---
    const [students, setStudents] = useState<GroupStudentResponse[]>([]);
    const [groupData, setGroupData] = useState<GroupDto | null>(null);
    
    // --- UI СОСТОЯНИЯ ---
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterTab, setFilterTab] = useState<'all' | 'active' | 'left'>('active');

    // --- МОДАЛКА ЗАЧИСЛЕНИЯ ---
    const [isEnrollOpen, setIsEnrollOpen] = useState<boolean>(false);
    const [enrollStudentId, setEnrollStudentId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // --- КРАСИВАЯ МОДАЛКА ИСКЛЮЧЕНИЯ ---
    const [isRemoveOpen, setIsRemoveOpen] = useState<boolean>(false);
    const [studentToRemove, setStudentToRemove] = useState<{ id: number; name: string } | null>(null);
    const [removeReason, setRemoveReason] = useState<string>('');
    const [isRemoving, setIsRemoving] = useState<boolean>(false);

    // --- БЕЗОПАСНЫЙ МЕТОД ЗАГРУЗКИ ДАННЫХ ---
    const loadPageData = useCallback(async () => {
        if (!groupId || isNaN(groupId)) {
            setError("Некорректный ID группы в URL-адресе");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [fetchedStudentsRes, fetchedGroupInfoRes] = await Promise.all([
                groupStudentService.getById(groupId),
                groupService.getById(groupId)
            ]);

            // 🛠️ Универсальная распаковка студентов
            let finalStudents: GroupStudentResponse[] = [];
            const resStudents = fetchedStudentsRes as any;
            if (resStudents?.data?.data) {
                finalStudents = resStudents.data.data;
            } else if (resStudents?.data) {
                finalStudents = resStudents.data;
            } else if (Array.isArray(resStudents)) {
                finalStudents = resStudents;
            }
            setStudents(finalStudents);

            // 🛠️ Универсальная распаковка данных группы
            let finalGroupData: GroupDto | null = null;
            const resGroup = fetchedGroupInfoRes as any;
            if (resGroup?.data?.data) {
                finalGroupData = resGroup.data.data;
            } else if (resGroup?.data) {
                finalGroupData = resGroup.data;
            } else if (resGroup && typeof resGroup === 'object' && 'id' in resGroup) {
                finalGroupData = resGroup;
            }

            if (finalGroupData) {
                setGroupData(finalGroupData);
            } else {
                setError("Бэкенд вернул пустые данные или неверную структуру для группы");
            }

        } catch (err: any) {
            console.error("EduCrm API Sync Error:", err);
            setError(err.message || "Не удалось синхронизировать данные с сервером API");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    // --- ХЕНДЛЕРЫ ДЕЙСТВИЙ ---
    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const studentIdNum = Number(enrollStudentId);
        
        if (!studentIdNum || isNaN(studentIdNum)) {
            alert('Введите корректный числовой ID студента');
            return;
        }

        try {
            setIsSubmitting(true);
            const success = await groupStudentService.enrollStudent(groupId, studentIdNum);
            
            if (success) {
                setEnrollStudentId('');
                setIsEnrollOpen(false);
                await loadPageData(); 
            } else {
                alert('Операция зачисления отклонена бэкендом.');
            }
        } catch (err: any) {
            alert(err.message || 'Ошибка при вызове EnrollAsync');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Открытие красивого модального окна вместо prompt()
    const handleRemoveClick = (groupStudentId: number, studentName: string) => {
        setStudentToRemove({ id: groupStudentId, name: studentName });
        setRemoveReason(''); // Сбрасываем текст причины
        setIsRemoveOpen(true);
    };

    // Подтверждение исключения из красивой модалки
    const handleRemoveConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentToRemove) return;

        try {
            setIsRemoving(true);
            const success = await groupStudentService.removeStudent(
                studentToRemove.id, 
                removeReason.trim() || "Исключен"
            );
            
            if (success) {
                setIsRemoveOpen(false);
                setStudentToRemove(null);
                await loadPageData();
            }
        } catch (err: any) {
            alert(err.message || "Ошибка при удалении");
        } finally {
            setIsRemoving(false);
        }
    };

    // --- ФИЛЬТРАЦИЯ И СЧЕТЧИКИ ---
    const filteredStudents = students.filter(s => {
        const name = s.studentName?.toLowerCase() || '';
        const email = s.studentEmail?.toLowerCase() || '';
        const query = searchTerm.toLowerCase();
        const matchesSearch = name.includes(query) || email.includes(query);
        
        if (filterTab === 'active') return matchesSearch && s.isActive;
        if (filterTab === 'left') return matchesSearch && !s.isActive;
        return matchesSearch;
    });

    const activeCount = students.filter(s => s.isActive).length;
    const totalCount = students.length;

    if (loading) {
        return (
            <div style={st.centerState}>
                <Loader2 size={36} style={st.spinner} />
                <p style={{ marginTop: 14, color: '#475569', fontWeight: 500 }}>
                    Получение конфигурации группы из базы данных...
                </p>
            </div>
        );
    }

    return (
        <div style={st.container}>
            {/* Навигационная панель */}
            <div style={st.navBar}>
                <button style={st.backButton} onClick={() => navigate('/admin/groups')}>
                    <ArrowLeft size={16} /> Назад к списку групп
                </button>
                <div style={st.breadcrumbs}>
                    <span>Панель управления</span> / <span>Группы</span> / <span style={{ color: '#0F172A' }}>Детали</span>
                </div>
            </div>

            {error && (
                <div style={st.errorBanner}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Блок заголовка */}
            <div style={st.headerBlock}>
                <div>
                    <h2 style={st.title}>
                        {groupData ? groupData.name : `Группа #${groupId}`}
                        {groupData?.status === 'Active' && <span style={st.statusBadge}>Active</span>}
                    </h2>
                    <p style={st.subtitle}>Просмотр расписания, назначенных преподавателей и аудит студентов</p>
                </div>
            </div>

            {/* Карточки действий */}
            {groupData && (
                <ActionCards 
                    group={groupData} 
                    onNavigate={navigate} 
                    onEnrollClick={() => setIsEnrollOpen(true)} 
                />
            )}

            <hr style={st.divider} />

            {/* Фильтры и поиск */}
            <div style={st.workspaceHeader}>
                <h3 style={st.sectionTitle}>Состав учебной группы</h3>
                
                <div style={st.controlsRow}>
                    <div style={st.tabsGroup}>
                        <button style={filterTab === 'active' ? st.tabActive : st.tab} onClick={() => setFilterTab('active')}>
                            Активные студенты ({activeCount})
                        </button>
                        <button style={filterTab === 'left' ? st.tabActive : st.tab} onClick={() => setFilterTab('left')}>
                            Исключенные ({totalCount - activeCount})
                        </button>
                        <button style={filterTab === 'all' ? st.tabActive : st.tab} onClick={() => setFilterTab('all')}>
                            Все ({totalCount})
                        </button>
                    </div>

                    <div style={st.searchContainer}>
                        <Search size={16} style={st.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Поиск студента по ФИО..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            style={st.searchInput} 
                        />
                    </div>
                </div>
            </div>

            {/* Таблица */}
            {filteredStudents.length > 0 ? (
                <StudentTable 
                    students={filteredStudents} 
                    onRemove={(id) => {
                        const target = students.find(x => x.id === id);
                        handleRemoveClick(id, target?.studentName || `Студента с ID #${id}`);
                    }} 
                    onTransfer={(studentId) => navigate(`/admin/groups/${groupId}/transfer/${studentId}`)} 
                />
            ) : (
                <div style={st.emptyState}>
                    <Info size={24} color="#94A3B8" />
                    <p style={{ margin: '8px 0 0 0', color: '#64748B', fontSize: '14px' }}>
                        В этой категории пока нет ни одного студента.
                    </p>
                </div>
            )}

            {/* Модалка зачисления */}
            {isEnrollOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsEnrollOpen(false)}>
                    <div style={st.modalContent}>
                        <div style={st.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={18} color="#4F46E5" />
                                <h3 style={st.modalTitle}>Зачислить студента в группу</h3>
                            </div>
                            <button onClick={() => setIsEnrollOpen(false)} style={st.closeModalBtn} disabled={isSubmitting}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEnrollSubmit} style={st.modalBody}>
                            <label style={st.modalLabel}>Укажите ID Студента (ID из базы EduCrm)</label>
                            <input 
                                type="number" 
                                placeholder="Например: 15" 
                                value={enrollStudentId}
                                onChange={(e) => setEnrollStudentId(e.target.value)}
                                style={st.modalInput}
                                required
                                disabled={isSubmitting}
                                autoFocus
                            />
                            <div style={st.modalActions}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsEnrollOpen(false)} 
                                    style={st.modalCancelBtn} 
                                    disabled={isSubmitting}
                                >
                                    Отмена
                                </button>
                                <button type="submit" style={st.modalSubmitBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Сохранение...' : 'Подтвердить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── НОВАЯ КРАСИВАЯ МОДАЛКА ИСКЛЮЧЕНИЯ ── */}
            {isRemoveOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsRemoveOpen(false)}>
                    <div style={{ ...st.modalContent, maxWidth: '440px' }}>
                        <div style={{ ...st.modalHeader, borderBottom: '1px solid #FEE2E2', backgroundColor: '#FEF2F2' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserMinus size={18} color="#EF4444" />
                                <h3 style={{ ...st.modalTitle, color: '#991B1B' }}>Исключение из группы</h3>
                            </div>
                            <button onClick={() => setIsRemoveOpen(false)} style={{ ...st.closeModalBtn, color: '#991B1B' }} disabled={isRemoving}>
                                <X size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleRemoveConfirm} style={st.modalBody}>
                            <div style={st.removeWarningBox}>
                                Вы собираетесь исключить студента: <br />
                                <strong style={{ color: '#0F172A', fontSize: '15px' }}>{studentToRemove?.name}</strong>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                <label style={{ ...st.modalLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MessageSquare size={14} color="#64748B" /> 
                                    ОФИЦИАЛЬНАЯ ПРИЧИНА ИСКЛЮЧЕНИЯ
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Например: По собственному желанию / Академ" 
                                    value={removeReason}
                                    onChange={(e) => setRemoveReason(e.target.value)}
                                    style={st.modalInput}
                                    required
                                    disabled={isRemoving}
                                    autoFocus
                                />
                            </div>

                            <div style={st.modalActions}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsRemoveOpen(false)} 
                                    style={st.modalCancelBtn} 
                                    disabled={isRemoving}
                                >
                                    Отмена
                                </button>
                                <button 
                                    type="submit" 
                                    style={{ ...st.modalSubmitBtn, background: '#EF4444' }} 
                                    disabled={isRemoving || !removeReason.trim()}
                                >
                                    {isRemoving ? 'Исключение...' : 'Исключить студента'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- СТИЛИ ---
const st = {
    container: { padding: '24px 40px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
    backButton: { border: 'none', background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: '8px 14px', borderRadius: '8px', transition: 'background-color 0.15s' },
    breadcrumbs: { fontSize: '13px', color: '#94A3B8', fontWeight: 500, display: 'flex', gap: '6px' },
    headerBlock: { marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' },
    statusBadge: { fontSize: '11px', fontWeight: 700, backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    subtitle: { fontSize: '14px', color: '#64748B', margin: 0 },
    divider: { border: 'none', height: '1px', backgroundColor: '#E2E8F0', margin: '28px 0' },
    workspaceHeader: { marginBottom: '20px' },
    sectionTitle: { fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.01em' },
    controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '16px' },
    tabsGroup: { display: 'flex', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '10px', gap: '2px' },
    tab: { border: 'none', background: 'none', padding: '8px 14px', fontSize: '13px', color: '#475569', cursor: 'pointer', borderRadius: '6px', fontWeight: 500, transition: 'all 0.15s' },
    tabActive: { border: 'none', backgroundColor: '#FFFFFF', padding: '8px 14px', fontSize: '13px', color: '#0F172A', cursor: 'pointer', borderRadius: '6px', fontWeight: 600, boxShadow: '0 1px 3px rgba(15,23,42,0.08)' },
    searchContainer: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    searchIcon: { position: 'absolute' as const, left: '12px', color: '#94A3B8' },
    searchInput: { padding: '9px 14px 9px 38px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', width: '280px', backgroundColor: '#FFFFFF', transition: 'border-color 0.15s' },
    emptyState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px dashed #E2E8F0', textAlign: 'center' as const },
    centerState: { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' },
    spinner: { color: '#4F46E5' },
    errorBanner: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #E2E8F0' },
    modalHeader: { padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' },
    closeModalBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8' },
    modalBody: { padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    modalLabel: { fontSize: '12px', fontWeight: 700, color: '#64748B', letterSpacing: '0.03em' },
    modalInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', transition: 'all 0.15s' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
    modalCancelBtn: { padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#64748B', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
    modalSubmitBtn: { padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: '#FFFFFF', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
    
    // Стили плашки предупреждения внутри новой модалки
    removeWarningBox: {
        padding: '12px 14px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '13px',
        color: '#64748B',
        lineHeight: '1.5'
    }
};

export default GroupDetailsPage;