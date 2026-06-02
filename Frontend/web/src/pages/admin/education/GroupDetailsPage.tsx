import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Loader2, AlertCircle, X,
    UserPlus, Info, UserMinus, MessageSquare, Calendar, ArrowLeftRight, ChevronDown, Pencil
} from 'lucide-react';
import type { GroupStudentResponse } from '../../../types/groupStudent';
import type { GroupListItemResponse } from '../../../types/group';
import type { PagedResult, StudentListItemResponse } from '../../../types/admin';
import { ActionCards, type GroupDto } from '../../../components/ui/group/ActionCards';
import { groupStudentService } from '../../../api/groupStudentService';
import groupService from '../../../api/groupService';
import scheduleService from '../../../api/scheduleService';
import adminService from '../../../api/adminService';
import { StudentTable } from '../../../components/ui/group/StudentTable';
import type { ApiResult } from '../../../types/auth';
import type { AxiosResponse } from 'axios';

// --- КАСТOМНЫЙ СЕЛЕКТ С ЖИВЫМ ПОИСКОМ СТУДЕНТОВ ---
interface StudentAsyncSelectProps {
    onSelect: (id: number) => void;
    disabled?: boolean;
    excludeIds?: number[];
}

const StudentAsyncSelect: React.FC<StudentAsyncSelectProps> = ({ onSelect, disabled, excludeIds = [] }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [students, setStudents] = useState<StudentListItemResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const response: AxiosResponse<ApiResult<PagedResult<StudentListItemResponse>>> =
                    await adminService.getStudents(1, 20, search || undefined, true);

                const apiResult = response.data;

                if (apiResult?.data?.items) {
                    const filtered = apiResult.data.items.filter(s => !excludeIds.includes(s.id));
                    setStudents(filtered);
                } else {
                    setStudents([]);
                }
            } catch (err) {
                console.error('Ошибка поиска студентов:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, excludeIds]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Начните вводить имя или email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    disabled={disabled}
                    style={st.modalInput}
                />
                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', color: '#94A3B8', pointerEvents: 'none' }} />
            </div>

            {isOpen && (
                <div style={st.dropdownList}>
                    {loading && (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#64748B', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Loader2 size={16} style={st.spinner} /> Загрузка...
                        </div>
                    )}
                    {!loading && students.length === 0 && (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                            Нет доступных студентов
                        </div>
                    )}
                    {!loading && students.map((student) => (
                        <div
                            key={student.id}
                            onClick={() => {
                                setSearch(`${student.fullName} (${student.email})`);
                                onSelect(student.id);
                                setIsOpen(false);
                            }}
                            style={st.dropdownItem}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                        >
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>{student.fullName}</div>
                            <div style={{ color: '#64748B', fontSize: '11px' }}>{student.email}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---
const GroupDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const groupId = Number(id);
    const navigate = useNavigate();

    const [students, setStudents] = useState<GroupStudentResponse[]>([]);
    const [groupData, setGroupData] = useState<GroupDto | null>(null);
    const [availableGroups, setAvailableGroups] = useState<GroupListItemResponse[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterTab, setFilterTab] = useState<'all' | 'active' | 'left'>('active');

    const [isEnrollOpen, setIsEnrollOpen] = useState<boolean>(false);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [isRemoveOpen, setIsRemoveOpen] = useState<boolean>(false);
    const [studentToRemove, setStudentToRemove] = useState<{ id: number; name: string } | null>(null);
    const [removeReason, setRemoveReason] = useState<string>('');
    const [isRemoving, setIsRemoving] = useState<boolean>(false);

    const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
    const [studentToTransfer, setStudentToTransfer] = useState<{ id: number; name: string } | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string>('');
    const [isTransferring, setIsTransferring] = useState<boolean>(false);

    const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
    const [scheduleDay, setScheduleDay] = useState<string>('1');
    const [startTime, setStartTime] = useState<string>('18:00');
    const [endTime, setEndTime] = useState<string>('20:00');
    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    // --- МОДАЛКА РЕДАКТИРОВАНИЯ ГРУППЫ ---
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [editForm, setEditForm] = useState({
        name: '',
        mentorId: 0,
        startDate: '',
        endDate: '',
        maxStudents: 0,
    });
    const [mentors, setMentors] = useState<{ id: number; fullName: string }[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const daysMap: Record<string, string> = {
        '1': 'Пн', '2': 'Вт', '3': 'Ср', '4': 'Чт', '5': 'Пт', '6': 'Сб', '7': 'Вс',
        'Monday': 'Пн', 'Tuesday': 'Вт', 'Wednesday': 'Ср', 'Thursday': 'Чт', 'Friday': 'Пт', 'Saturday': 'Сб', 'Sunday': 'Вс'
    };

    const loadPageData = useCallback(async () => {
        if (!groupId || isNaN(groupId)) {
            setError("Некорректный ID группы в URL-адресе");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const [fetchedStudentsRes, fetchedGroupInfoRes, fetchedScheduleRes] = await Promise.all([
                groupStudentService.getById(groupId),
                groupService.getById(groupId),
                scheduleService.getByGroupId(groupId).catch(() => null)
            ]);

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

            let scheduleText: string | null = null;
            if (fetchedScheduleRes) {
                const resSchedule = fetchedScheduleRes as any;
                const rawScheduleArray = resSchedule?.data?.data || resSchedule?.data || resSchedule;

                if (Array.isArray(rawScheduleArray) && rawScheduleArray.length > 0) {
                    scheduleText = rawScheduleArray
                        .map((s: any) => {
                            const day = daysMap[String(s.dayOfWeek)] || s.dayOfWeek;
                            const start = s.startTime ? s.startTime.substring(0, 5) : '';
                            const end = s.endTime ? s.endTime.substring(0, 5) : '';

                            if (day && start && end) return `${day} ${start}-${end}`;
                            return day;
                        })
                        .filter(Boolean)
                        .join(', ');
                }
            }

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
                finalGroupData.schedule = scheduleText || null;
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

    const handleEnrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId) {
            alert('Пожалуйста, выберите студента из выпадающего списка');
            return;
        }

        try {
            setIsSubmitting(true);
            const success = await groupStudentService.enrollStudent(groupId, selectedStudentId);

            if (success) {
                setSelectedStudentId(null);
                setIsEnrollOpen(false);
                await loadPageData();
            } else {
                alert('Операция зачисления отклонена бэкендом.');
            }
        } catch (err: any) {
            alert(err.message || 'Ошибка при зачислении');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveClick = (groupStudentId: number, studentName: string) => {
        setStudentToRemove({ id: groupStudentId, name: studentName });
        setRemoveReason('');
        setIsRemoveOpen(true);
    };

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

    const handleTransferClick = async (groupStudentId: number, studentName: string) => {
        setStudentToTransfer({ id: groupStudentId, name: studentName });
        setTargetGroupId('');
        setIsTransferOpen(true);

        try {
            const res = await groupService.getAll({ page: 1, pageSize: 100 });
            const resData = res as any;
            const groupsList: GroupListItemResponse[] = resData?.data?.data?.items || resData?.data?.items || [];
            const filteredGroups = groupsList.filter(g => g.id !== groupId);
            setAvailableGroups(filteredGroups);
        } catch (err) {
            console.error("Не удалось загрузить целевые группы:", err);
        }
    };

    const handleTransferConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentToTransfer || !targetGroupId) return;

        try {
            setIsTransferring(true);
            const success = await groupStudentService.transferStudent(
                studentToTransfer.id,
                Number(targetGroupId)
            );

            if (success) {
                setIsTransferOpen(false);
                setStudentToTransfer(null);
                setTargetGroupId('');
                await loadPageData();
            } else {
                alert('Трансфер отклонен сервером. Возможно, в целевой группе нет мест.');
            }
        } catch (err: any) {
            alert(err.message || "Ошибка при переводе студента");
        } finally {
            setIsTransferring(false);
        }
    };

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsScheduling(true);
            const parsedDay = Number(scheduleDay);
            const defaultDate = new Date().toISOString().split('T')[0];
            const formattedRecurringFrom = groupData?.startDate
                ? groupData.startDate.split('T')[0]
                : defaultDate;

            await scheduleService.create({
                groupId: groupId,
                dayOfWeek: parsedDay,
                startTime: startTime,
                endTime: endTime,
                recurringFrom: formattedRecurringFrom
            });

            setIsScheduleOpen(false);
            await loadPageData();
        } catch (err: any) {
            alert(err.message || "Не удалось создать конфигурацию расписания");
        } finally {
            setIsScheduling(false);
        }
    };

    const openEditModal = async () => {
        if (!groupData) return;
        setEditForm({
            name: groupData.name || '',
            mentorId: (groupData as any).mentorId || 0,
            startDate: groupData.startDate?.split('T')[0] || '',
            endDate: (groupData as any).endDate?.split('T')[0] || '',
            maxStudents: (groupData as any).maxStudents || 0,
        });
        setIsEditOpen(true);

        try {
            const res = await adminService.getMentors(1, 100, undefined, true);
            const list = (res as any)?.data?.data?.items || [];
            setMentors(list.map((m: any) => ({ id: m.id, fullName: m.fullName })));
        } catch (err) {
            console.error('Не удалось загрузить менторов:', err);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsEditing(true);
            const payload: any = {
                name: editForm.name,
                maxStudents: editForm.maxStudents,
            };
            if (editForm.mentorId > 0) payload.mentorId = editForm.mentorId;
            if (editForm.startDate) {
                payload.startDate = new Date(editForm.startDate + 'T00:00:00Z').toISOString();
            }
            if (editForm.endDate) {
                payload.endDate = new Date(editForm.endDate + 'T00:00:00Z').toISOString();
            }

            await groupService.update(groupId, payload);
            setIsEditOpen(false);
            await loadPageData();
        } catch (err: any) {
            alert(err.response?.data?.error || err.message || 'Ошибка при обновлении группы');
        } finally {
            setIsEditing(false);
        }
    };

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
    const enrolledStudentIds = students.filter(s => s.isActive).map(s => s.studentId);

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

            <div style={st.headerBlock}>
                <div>
                    <h2 style={st.title}>
                        {groupData ? groupData.name : `Группа #${groupId}`}
                        {groupData?.status === 'Active' && <span style={st.statusBadge}>Active</span>}
                    </h2>
                    <p style={st.subtitle}>Просмотр расписания, назначенных преподавателей и аудит студентов</p>
                </div>
                {groupData && (
                    <button onClick={openEditModal} style={st.editGroupBtn}>
                        <Pencil size={14} />
                        Редактировать группу
                    </button>
                )}
            </div>

            {groupData && (
                <ActionCards
                    group={groupData}
                    onNavigate={navigate}
                    onEnrollClick={() => setIsEnrollOpen(true)}
                    onAddScheduleClick={() => setIsScheduleOpen(true)}
                />
            )}

            <hr style={st.divider} />

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

            {filteredStudents.length > 0 ? (
                <StudentTable
                    students={filteredStudents}
                    groupId={groupId}
                    groupStatus={groupData?.status ?? 'Active'}
                    onRemove={(id) => {
                        const target = students.find(x => x.id === id);
                        handleRemoveClick(id, target?.studentName || `Студента с ID #${id}`);
                    }}
                    onTransfer={(id) => {
                        const target = students.find(x => x.id === id);
                        handleTransferClick(id, target?.studentName || `Студента с ID #${id}`);
                    }}
                    onCharged={() => loadPageData()}
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
                        <div style={{ ...st.modalHeader, ...st.modalHeaderRounded }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserPlus size={18} color="#4F46E5" />
                                <h3 style={st.modalTitle}>Зачислить студента в группу</h3>
                            </div>
                            <button onClick={() => setIsEnrollOpen(false)} style={st.closeModalBtn} disabled={isSubmitting}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleEnrollSubmit} style={st.modalBody}>
                            <label style={st.modalLabel}>ВЫБЕРИТЕ СТУДЕНТА (ЖИВОЙ ПОИСК)</label>

                            <StudentAsyncSelect
                                onSelect={(id) => setSelectedStudentId(id)}
                                disabled={isSubmitting}
                                excludeIds={enrolledStudentIds}
                            />

                            <div style={st.modalActions}>
                                <button type="button" onClick={() => setIsEnrollOpen(false)} style={st.modalCancelBtn} disabled={isSubmitting}>
                                    Отмена
                                </button>
                                <button type="submit" style={st.modalSubmitBtn} disabled={isSubmitting || !selectedStudentId}>
                                    {isSubmitting ? 'Сохранение...' : 'Подтвердить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка исключения */}
            {isRemoveOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsRemoveOpen(false)}>
                    <div style={{ ...st.modalContent, maxWidth: '440px' }}>
                        <div style={{
                            ...st.modalHeader,
                            ...st.modalHeaderRounded,
                            borderBottom: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                        }}>
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
                                <button type="button" onClick={() => setIsRemoveOpen(false)} style={st.modalCancelBtn} disabled={isRemoving}>
                                    Отмена
                                </button>
                                <button type="submit" style={{ ...st.modalSubmitBtn, background: '#EF4444' }} disabled={isRemoving || !removeReason.trim()}>
                                    {isRemoving ? 'Исключение...' : 'Исключить студента'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка трансфера */}
            {isTransferOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsTransferOpen(false)}>
                    <div style={st.modalContent}>
                        <div style={{
                            ...st.modalHeader,
                            ...st.modalHeaderRounded,
                            borderBottom: '1px solid #D1FAE5',
                            backgroundColor: '#F0FDF4',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowLeftRight size={18} color="#10B981" />
                                <h3 style={{ ...st.modalTitle, color: '#065F46' }}>Перевод в другую группу</h3>
                            </div>
                            <button onClick={() => setIsTransferOpen(false)} style={{ ...st.closeModalBtn, color: '#065F46' }} disabled={isTransferring}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleTransferConfirm} style={st.modalBody}>
                            <div style={{ ...st.removeWarningBox, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                                Вы переводите студента: <br />
                                <strong style={{ color: '#0F172A', fontSize: '15px' }}>{studentToTransfer?.name}</strong>
                            </div>

                            <label style={st.modalLabel}>ВЫБЕРИТЕ ЦЕЛЕВУЮ ГРУППУ</label>
                            <select
                                value={targetGroupId}
                                onChange={(e) => setTargetGroupId(e.target.value)}
                                style={st.modalInput}
                                disabled={isTransferring || availableGroups.length === 0}
                                required
                            >
                                <option value="">-- Выберите группу --</option>
                                {availableGroups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.name} ({g.courseName || 'Без курса'})
                                    </option>
                                ))}
                            </select>

                            {availableGroups.length === 0 && (
                                <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                                    Загрузка доступных групп или список пуст...
                                </p>
                            )}

                            <div style={st.modalActions}>
                                <button type="button" onClick={() => setIsTransferOpen(false)} style={st.modalCancelBtn} disabled={isTransferring}>
                                    Отмена
                                </button>
                                <button type="submit" style={{ ...st.modalSubmitBtn, background: '#10B981' }} disabled={isTransferring || !targetGroupId}>
                                    {isTransferring ? 'Перевод...' : 'Подтвердить перевод'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка расписания */}
            {isScheduleOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsScheduleOpen(false)}>
                    <div style={st.modalContent}>
                        <div style={{ ...st.modalHeader, ...st.modalHeaderRounded }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={18} color="#EA580C" />
                                <h3 style={st.modalTitle}>Добавить день в расписание</h3>
                            </div>
                            <button onClick={() => setIsScheduleOpen(false)} style={st.closeModalBtn} disabled={isScheduling}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleSubmit} style={st.modalBody}>
                            <label style={st.modalLabel}>ВЫБЕРИТЕ ДЕНЬ НЕДЕЛИ</label>
                            <select value={scheduleDay} onChange={(e) => setScheduleDay(e.target.value)} style={st.modalInput} disabled={isScheduling}>
                                <option value="1">Понедельник</option>
                                <option value="2">Вторник</option>
                                <option value="3">Среда</option>
                                <option value="4">Четверг</option>
                                <option value="5">Пятница</option>
                                <option value="6">Суббота</option>
                                <option value="7">Воскресенье</option>
                            </select>

                            <label style={st.modalLabel}>ВРЕМЯ НАЧАЛА</label>
                            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={st.modalInput} disabled={isScheduling} required />

                            <label style={st.modalLabel}>ВРЕМЯ ОКОНЧАНИЯ</label>
                            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={st.modalInput} disabled={isScheduling} required />

                            <div style={st.modalActions}>
                                <button type="button" onClick={() => setIsScheduleOpen(false)} style={st.modalCancelBtn} disabled={isScheduling}>
                                    Отмена
                                </button>
                                <button type="submit" style={{ ...st.modalSubmitBtn, background: '#EA580C' }} disabled={isScheduling}>
                                    {isScheduling ? 'Создание...' : 'Добавить день'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditOpen && (
                <div style={st.modalOverlay} onClick={e => e.target === e.currentTarget && setIsEditOpen(false)}>
                    <div style={st.editModalContent}>
                        <button onClick={() => setIsEditOpen(false)} style={st.editCloseBtn} disabled={isEditing}>
                            <X size={18} />
                        </button>

                        <h3 style={st.editTitle}>Редактирование группы</h3>
                        <p style={st.editSubtitle}>Измените параметры группы и сохраните изменения.</p>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <div>
                                <label style={st.editLabel}>НАЗВАНИЕ ГРУППЫ</label>
                                <input
                                    type="text" required style={st.editInput}
                                    placeholder="Например: FRNT-2026-01"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    disabled={isEditing}
                                />
                            </div>
                            <div>
                                <label style={st.editLabel}>НАЗНАЧИТЬ МЕНТОРА</label>
                                <select
                                    style={st.editInput}
                                    value={editForm.mentorId}
                                    onChange={e => setEditForm({ ...editForm, mentorId: Number(e.target.value) })}
                                    disabled={isEditing}
                                >
                                    <option value={0}>-- Без изменений --</option>
                                    {mentors.map(m => (
                                        <option key={m.id} value={m.id}>{m.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={st.editLabel}>ДАТА НАЧАЛА</label>
                                    <input
                                        type="date" style={st.editInput}
                                        value={editForm.startDate}
                                        onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                                        disabled={isEditing}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={st.editLabel}>ДАТА ОКОНЧАНИЯ</label>
                                    <input
                                        type="date" style={st.editInput}
                                        value={editForm.endDate}
                                        onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                                        disabled={isEditing}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={st.editLabel}>МАКС. СТУДЕНТОВ</label>
                                <input
                                    type="number" min={1} style={st.editInput}
                                    value={editForm.maxStudents}
                                    onChange={e => setEditForm({ ...editForm, maxStudents: Number(e.target.value) })}
                                    disabled={isEditing}
                                />
                            </div>

                            <button type="submit" style={st.editSubmitBtn} disabled={isEditing}>
                                {isEditing ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetailsPage;


// --- СТИЛИ ---
const st = {
    container: { padding: '24px 40px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },
    backButton: { border: 'none', background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', padding: '8px 14px', borderRadius: '8px', transition: 'background-color 0.15s' },
    breadcrumbs: { fontSize: '13px', color: '#94A3B8', fontWeight: 500, display: 'flex', gap: '6px' },
    headerBlock: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
    title: { fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' },
    statusBadge: { fontSize: '11px', fontWeight: 700, backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    subtitle: { fontSize: '14px', color: '#64748B', margin: 0 },
    editGroupBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap' as const },
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
    spinner: { color: '#4F46E5', animation: 'spin 1s linear infinite' },
    errorBanner: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 },
    removeWarningBox: { padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', color: '#64748B', fontSize: '13px', lineHeight: '1.5' },
    editCloseBtn: { position: 'absolute' as const, top: '20px', right: '20px', background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '32px', height: '32px' },
    editTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' },
    editSubtitle: { margin: '6px 0 0 0', fontSize: '13px', color: '#64748B', lineHeight: 1.4 },
    editModalContent: { backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '32px', position: 'relative' as const },
    editLabel: { fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' },
    editInput: { width: '100%', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const },
    editSubmitBtn: { marginTop: '6px', height: '48px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'visible' as const, border: '1px solid #E2E8F0' },
    modalHeader: { padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalHeaderRounded: { borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
    modalTitle: { margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' },
    closeModalBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' },
    modalBody: { padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '16px' },
    modalLabel: { fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' },
    modalInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' },
    modalCancelBtn: { border: 'none', background: '#F1F5F9', color: '#475569', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
    modalSubmitBtn: { border: 'none', background: '#4F46E5', color: '#FFFFFF', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },

    dropdownList: { position: 'absolute' as const, top: '105%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' as const, zIndex: 1100, padding: '4px' },
    dropdownItem: { padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: '2px', transition: 'background-color 0.1s' }
};