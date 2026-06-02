import React, { useEffect, useMemo, useState } from 'react';
import {
    Plus, Search, Phone, Mail, Loader2, Trash2, X, Pencil, MessageCircle, UserCheck,
    Camera, Globe, Send, Users, User, PhoneCall, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import leadService from '../../../api/leadService';
import courseService from '../../../api/courseService';
import adminService from '../../../api/adminService';
import MetricCard from '../../../components/ui/MetricCard';
import type { Lead, LeadDetails } from '../../../types/lead';
import {
    LEAD_STATUS, LEAD_SOURCE,
    LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUS_COLORS,
} from '../../../types/lead';

interface Course { id: number; name: string; }
interface Manager { id: number; fullName: string; role: string; }

// иконка и цвет для источника
const sourceIcon = (src: string) => {
    switch (src) {
        case 'Instagram': return { icon: <Camera size={14} />, color: '#E1306C' };
        case 'Website': return { icon: <Globe size={14} />, color: '#2563EB' };
        case 'Telegram': return { icon: <Send size={14} />, color: '#0088CC' };
        case 'Referral': return { icon: <Users size={14} />, color: '#10B981' };
        case 'WalkIn': return { icon: <User size={14} />, color: '#F59E0B' };
        case 'Phone': return { icon: <PhoneCall size={14} />, color: '#6366F1' };
        default: return { icon: <MoreHorizontal size={14} />, color: '#94A3B8' };
    }
};

const LeadsPage: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [allLeadsForStats, setAllLeadsForStats] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | ''>('');
    const [sourceFilter, setSourceFilter] = useState<number | ''>('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [courses, setCourses] = useState<Course[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState<{
        fullName: string; phone: string; email: string;
        source: number; interestedCourseId: number; notes: string;
    }>({
        fullName: '', phone: '', email: '',
        source: LEAD_SOURCE.Instagram, interestedCourseId: 0, notes: '',
    });

    // delete confirm
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // details
    const [details, setDetails] = useState<LeadDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'activity'>('info');

    const [isEditMode, setIsEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: '', phone: '', email: '',
        source: 0, interestedCourseId: 0, notes: '',
    });

    const [newStatus, setNewStatus] = useState<number>(0);
    const [statusComment, setStatusComment] = useState('');
    const [lostReason, setLostReason] = useState('');

    const [newManagerId, setNewManagerId] = useState<number>(0);

    const [activityType, setActivityType] = useState('note');
    const [activityText, setActivityText] = useState('');

    const loadLeads = async () => {
        setLoading(true);
        try {
            const res = await leadService.getAll({
                page, pageSize: 20,
                search: search || undefined,
                status: statusFilter || undefined,
                source: sourceFilter || undefined,
            });
            if (res.data.isSuccess && res.data.data) {
                setLeads(res.data.data.items);
                setTotalCount(res.data.data.totalCount);
            }
        } catch (err) {
            console.error('Не удалось загрузить лидов:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllForStats = async () => {
        try {
            const res = await leadService.getAll({ page: 1, pageSize: 1000 });
            if (res.data.isSuccess && res.data.data) {
                setAllLeadsForStats(res.data.data.items);
            }
        } catch (err) {
            console.error('Не удалось загрузить статистику:', err);
        }
    };

    const loadCourses = async () => {
        try {
            const res = await (courseService as any).getAll?.();
            const list = res?.data?.data?.items || res?.data?.data || [];
            setCourses(list.map((c: any) => ({ id: c.id, name: c.name })));
        } catch (err) {
            console.error('Не удалось загрузить курсы:', err);
        }
    };

    const loadManagers = async () => {
        try {
            const [mentRes, usersRes] = await Promise.all([
                adminService.getMentors(1, 100, undefined, true),
                adminService.getUsers(),
            ]);

            const mentList = (mentRes as any)?.data?.data?.items || [];
            const usersData = (usersRes as any)?.data?.data;
            const usersList = usersData?.items || usersData || [];
            const admins = (Array.isArray(usersList) ? usersList : []).filter((u: any) => u.role === 'Admin');

            const combined: Manager[] = [
                ...admins.map((a: any) => ({ id: a.id, fullName: a.fullName, role: 'Admin' })),
                ...mentList.map((m: any) => ({ id: m.userId || m.id, fullName: m.fullName, role: 'Mentor' })),
            ];
            setManagers(combined);
        } catch (err) {
            console.error('Не удалось загрузить менеджеров:', err);
        }
    };

    useEffect(() => { loadLeads(); }, [page, statusFilter, sourceFilter]);
    useEffect(() => {
        const t = setTimeout(loadLeads, 400);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => { loadAllForStats(); }, []);

    const metrics = useMemo(() => {
        const total = allLeadsForStats.length;
        const converted = allLeadsForStats.filter(l => l.status === 'Converted').length;
        const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

        const sources: Record<string, number> = {};
        allLeadsForStats.forEach(l => { sources[l.source] = (sources[l.source] || 0) + 1; });
        const topSourceEntry = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];
        const topSourceLabel = topSourceEntry ? (LEAD_SOURCE_LABELS[topSourceEntry[0]] || topSourceEntry[0]) : '—';
        const topSourceCount = topSourceEntry ? topSourceEntry[1] : 0;

        const today = new Date().toDateString();
        const todayCount = allLeadsForStats.filter(l =>
            new Date(l.createdAt).toDateString() === today
        ).length;

        return { total, conversionRate, topSourceLabel, topSourceCount, todayCount };
    }, [allLeadsForStats]);

    const openCreateModal = () => {
        setCreateForm({
            fullName: '', phone: '', email: '',
            source: LEAD_SOURCE.Instagram, interestedCourseId: 0, notes: '',
        });
        loadCourses();
        setIsCreateOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const payload: any = {
                fullName: createForm.fullName, phone: createForm.phone, source: createForm.source,
            };
            if (createForm.email) payload.email = createForm.email;
            if (createForm.interestedCourseId > 0) payload.interestedCourseId = createForm.interestedCourseId;
            if (createForm.notes) payload.notes = createForm.notes;

            await leadService.create(payload);
            setIsCreateOpen(false);
            await loadLeads();
            await loadAllForStats();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка создания лида');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDetails = async (id: number) => {
        setActiveTab('info');
        setIsEditMode(false);
        setDetailsLoading(true);
        try {
            const res = await leadService.getById(id);
            if (res.data.isSuccess && res.data.data) {
                const d = res.data.data;
                setDetails(d);
                setEditForm({
                    fullName: d.fullName, phone: d.phone, email: d.email || '',
                    source: getSourceNum(d.source),
                    interestedCourseId: d.interestedCourseId || 0,
                    notes: d.notes || '',
                });
                setNewStatus(getStatusNum(d.status));
                setNewManagerId(d.assignedManagerId || 0);
            }
            await Promise.all([loadCourses(), loadManagers()]);
        } catch (err) {
            console.error('Не удалось открыть лида:', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetails(null);
        setIsEditMode(false);
        setStatusComment('');
        setLostReason('');
        setActivityText('');
        setActivityType('note');
    };

    const reloadDetails = async () => {
        if (!details) return;
        const res = await leadService.getById(details.id);
        if (res.data.isSuccess && res.data.data) setDetails(res.data.data);
        await loadLeads();
        await loadAllForStats();
    };

    const handleEditSave = async () => {
        if (!details) return;
        try {
            setIsSubmitting(true);
            const payload: any = {
                fullName: editForm.fullName, phone: editForm.phone, source: editForm.source,
            };
            if (editForm.email !== details.email) payload.email = editForm.email;
            if (editForm.interestedCourseId !== (details.interestedCourseId || 0))
                payload.interestedCourseId = editForm.interestedCourseId > 0 ? editForm.interestedCourseId : null;
            if (editForm.notes !== (details.notes || '')) payload.notes = editForm.notes;

            await leadService.update(details.id, payload);
            setIsEditMode(false);
            await reloadDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async () => {
        if (!details || newStatus === getStatusNum(details.status)) return;
        try {
            setIsSubmitting(true);
            const payload: any = { status: newStatus };
            if (statusComment) payload.comment = statusComment;
            if (newStatus === LEAD_STATUS.Lost && lostReason) payload.lostReason = lostReason;

            await leadService.changeStatus(details.id, payload);
            setStatusComment(''); setLostReason('');
            await reloadDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка смены статуса');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssign = async () => {
        if (!details || newManagerId === 0 || newManagerId === details.assignedManagerId) return;
        try {
            setIsSubmitting(true);
            await leadService.assignManager(details.id, newManagerId);
            await reloadDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка назначения');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddActivity = async () => {
        if (!details || !activityText.trim()) return;
        try {
            setIsSubmitting(true);
            await leadService.addActivity(details.id, activityType, activityText.trim());
            setActivityText('');
            await reloadDetails();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка добавления касания');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            setIsDeleting(true);
            await leadService.delete(deleteTarget.id);
            setDeleteTarget(null);
            await loadLeads();
            await loadAllForStats();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ошибка удаления');
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / 20);

    // умная пагинация: рисуем кнопки
    const renderPages = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const arr: (number | string)[] = [1];
        if (page > 3) arr.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i);
        if (page < totalPages - 2) arr.push('...');
        arr.push(totalPages);
        return arr;
    };

    return (
        <div style={s.page}>
            {/* HEADER */}
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>Лиды</h1>
                    <p style={s.subtitle}>Потенциальные клиенты и воронка продаж</p>
                </div>
            </div>

            {/* METRICS — главная карточка кликабельна */}
            <div style={s.metricsGrid}>
                <div onClick={openCreateModal} style={{ cursor: 'pointer', flex: '1 1 240px', minWidth: '240px', position: 'relative' }} title="Добавить нового лида">
                    <MetricCard
                        value={metrics.total}
                        label="Всего лидов"
                        subLabel="Нажмите чтобы добавить"
                        isMain
                    />
                    <div style={s.plusBadge}><Plus size={18} color="#FFFFFF" /></div>
                </div>

                <MetricCard value={`${metrics.conversionRate}%`} label="Конверсия" subLabel="Стали студентами" variant="purple" />
                <MetricCard
                    value={metrics.topSourceLabel}
                    label="Топ источник"
                    subLabel={metrics.topSourceCount > 0 ? `${metrics.topSourceCount} заявок` : 'Нет данных'}
                    variant="blue"
                />
                <MetricCard value={metrics.todayCount} label="За сегодня" subLabel="Новые заявки" variant="amber" />
            </div>

            {/* CONTROLS */}
            <div style={s.controls}>
                <div style={s.searchWrap}>
                    <Search size={16} style={s.searchIcon} />
                    <input
                        style={s.searchInput} type="text"
                        placeholder="Поиск по имени, телефону, email..."
                        value={search} onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    style={s.filterSelect} value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value ? Number(e.target.value) : '')}
                >
                    <option value="">Все статусы</option>
                    {Object.entries(LEAD_STATUS).map(([key, value]) => (
                        <option key={value} value={value}>{LEAD_STATUS_LABELS[key]}</option>
                    ))}
                </select>
                <select
                    style={s.filterSelect} value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value ? Number(e.target.value) : '')}
                >
                    <option value="">Все источники</option>
                    {Object.entries(LEAD_SOURCE).map(([key, value]) => (
                        <option key={value} value={value}>{LEAD_SOURCE_LABELS[key]}</option>
                    ))}
                </select>
            </div>

            {/* TABLE */}
            {loading ? (
                <div style={s.loadingState}><Loader2 size={28} style={s.spinner} /></div>
            ) : leads.length === 0 ? (
                <div style={s.emptyState}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                        Лидов пока нет
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                        Нажмите на «Всего лидов» чтобы добавить первого
                    </div>
                </div>
            ) : (
                <div style={s.tableWrap}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thRow}>
                                <th style={s.th}>ФИО</th>
                                <th style={s.th}>Контакты</th>
                                <th style={s.th}>Источник</th>
                                <th style={s.th}>Курс</th>
                                <th style={s.th}>Статус</th>
                                <th style={s.th}>Менеджер</th>
                                <th style={s.th}>Создан</th>
                                <th style={{ ...s.th, textAlign: 'right' as const, paddingRight: '20px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => {
                                const sc = LEAD_STATUS_COLORS[lead.status] || { bg: '#F1F5F9', color: '#475569' };
                                const si = sourceIcon(lead.source);
                                return (
                                    <tr key={lead.id} style={s.tr} className="lead-row" onClick={() => openDetails(lead.id)}>
                                        <td style={{ ...s.td, fontWeight: 700, color: '#0F172A' }}>{lead.fullName}</td>
                                        <td style={s.td}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={12} color="#64748B" /> {lead.phone}
                                                </span>
                                                {lead.email && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
                                                        <Mail size={12} /> {lead.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ ...s.sourcePill, color: si.color, borderColor: si.color + '33', background: si.color + '0D' }}>
                                                {si.icon}
                                                {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                                            </span>
                                        </td>
                                        <td style={s.td}>{lead.interestedCourseName || '—'}</td>
                                        <td style={s.td}>
                                            <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>
                                                {LEAD_STATUS_LABELS[lead.status] || lead.status}
                                            </span>
                                        </td>
                                        <td style={s.td}>{lead.assignedManagerName || '—'}</td>
                                        <td style={s.td}>{new Date(lead.createdAt).toLocaleDateString('ru-RU')}</td>
                                        <td style={{ ...s.td, textAlign: 'right' as const, paddingRight: '12px' }} onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                <button
                                                    className="row-action-edit"
                                                    style={s.editBtn}
                                                    onClick={() => openDetails(lead.id)}
                                                    title="Редактировать"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className="row-action-del"
                                                    style={s.deleteBtnRow}
                                                    onClick={() => setDeleteTarget({ id: lead.id, name: lead.fullName })}
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINATION */}
            <div style={s.pagination}>
                <button
                    style={{ ...s.pageArrow, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    <ChevronLeft size={16} />
                </button>

                {renderPages().map((p, i) => p === '...' ? (
                    <span key={`dot-${i}`} style={s.pageDots}>…</span>
                ) : (
                    <button
                        key={p}
                        style={p === page ? s.pageBtnActive : s.pageBtnSquare}
                        onClick={() => setPage(p as number)}
                    >
                        {p}
                    </button>
                ))}

                <button
                    style={{ ...s.pageArrow, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <style>{`
                .lead-row { cursor: pointer; transition: background 0.15s; }
                .lead-row:hover { background: #F8FAFC; }
                .row-action-edit:hover { background: #EEF2FF !important; color: #4F46E5 !important; border-color: #C7D2FE !important; }
                .row-action-del:hover { background: #FEF2F2 !important; color: #EF4444 !important; border-color: #FECACA !important; }
            `}</style>

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && setIsCreateOpen(false)}>
                    <div style={s.modal}>
                        <button style={s.closeIcon} onClick={() => setIsCreateOpen(false)}><X size={18} /></button>
                        <h3 style={s.modalTitle}>Новый лид</h3>
                        <p style={s.modalSubtitle}>Заполните контакты потенциального клиента</p>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                            <div>
                                <label style={s.label}>ФИО *</label>
                                <input type="text" required style={s.input} placeholder="Иван Иванов"
                                    value={createForm.fullName}
                                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label style={s.label}>ТЕЛЕФОН *</label>
                                <input type="tel" required style={s.input} placeholder="+992 99 999 99 99"
                                    value={createForm.phone}
                                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label style={s.label}>EMAIL</label>
                                <input type="email" style={s.input} placeholder="ivanov@mail.ru"
                                    value={createForm.email}
                                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label style={s.label}>ИСТОЧНИК *</label>
                                <select style={s.input} value={createForm.source}
                                    onChange={e => setCreateForm({ ...createForm, source: Number(e.target.value) })}
                                    disabled={isSubmitting}
                                >
                                    {Object.entries(LEAD_SOURCE).map(([key, value]) => (
                                        <option key={value} value={value}>{LEAD_SOURCE_LABELS[key]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>ИНТЕРЕСУЮЩИЙ КУРС</label>
                                <select style={s.input} value={createForm.interestedCourseId}
                                    onChange={e => setCreateForm({ ...createForm, interestedCourseId: Number(e.target.value) })}
                                    disabled={isSubmitting}
                                >
                                    <option value={0}>-- Не выбрано --</option>
                                    {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label style={s.label}>ЗАМЕТКИ</label>
                                <textarea
                                    style={{ ...s.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                                    placeholder="Что важно знать о клиенте..."
                                    value={createForm.notes}
                                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                <button type="button" style={s.cancelBtn} onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                                    Отмена
                                </button>
                                <button type="submit" style={s.submitBtn} disabled={isSubmitting}>
                                    {isSubmitting ? 'Создание...' : 'Создать лида'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM MODAL */}
            {deleteTarget && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && setDeleteTarget(null)}>
                    <div style={{ ...s.modal, width: '420px' }}>
                        <button style={s.closeIcon} onClick={() => setDeleteTarget(null)}><X size={18} /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={s.delIconWrap}><Trash2 size={20} color="#EF4444" /></div>
                            <div>
                                <h3 style={{ ...s.modalTitle, color: '#991B1B' }}>Удалить лида</h3>
                                <p style={{ ...s.modalSubtitle, margin: '2px 0 0 0' }}>Действие необратимо</p>
                            </div>
                        </div>

                        <div style={s.delWarnBox}>
                            Вы собираетесь удалить лида: <br />
                            <strong style={{ color: '#0F172A', fontSize: '15px' }}>{deleteTarget.name}</strong>
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#94A3B8' }}>
                                Будет также удалена вся история касаний этого лида.
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button style={s.cancelBtn} onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                                Отмена
                            </button>
                            <button
                                style={{ ...s.submitBtn, background: '#EF4444' }}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Удаление...' : 'Удалить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {details && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && closeDetails()}>
                    <div style={{ ...s.modal, width: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button style={s.closeIcon} onClick={closeDetails}><X size={18} /></button>

                        {detailsLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Loader2 size={28} style={s.spinner} />
                            </div>
                        ) : (
                            <>
                                <div style={{ paddingRight: '40px' }}>
                                    <h3 style={s.modalTitle}>{details.fullName}</h3>
                                    <p style={s.modalSubtitle}>
                                        {details.phone}{details.email ? ` · ${details.email}` : ''}
                                    </p>
                                    <span style={{
                                        ...s.badge,
                                        background: (LEAD_STATUS_COLORS[details.status] || { bg: '#F1F5F9' }).bg,
                                        color: (LEAD_STATUS_COLORS[details.status] || { color: '#475569' }).color,
                                        marginTop: '10px',
                                        display: 'inline-block',
                                    }}>
                                        {LEAD_STATUS_LABELS[details.status] || details.status}
                                    </span>
                                </div>

                                <div style={s.tabsBar}>
                                    <button
                                        style={{ ...s.tabBtn, ...(activeTab === 'info' ? s.tabBtnActive : {}) }}
                                        onClick={() => setActiveTab('info')}
                                    >
                                        Информация
                                    </button>
                                    <button
                                        style={{ ...s.tabBtn, ...(activeTab === 'activity' ? s.tabBtnActive : {}) }}
                                        onClick={() => setActiveTab('activity')}
                                    >
                                        История ({details.activities.length})
                                    </button>
                                </div>

                                {activeTab === 'info' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                                        <div style={s.section}>
                                            <div style={s.sectionHead}>
                                                <span style={s.sectionTitle}>Данные клиента</span>
                                                {!isEditMode ? (
                                                    <button style={s.iconBtn} onClick={() => setIsEditMode(true)}>
                                                        <Pencil size={14} /> Редактировать
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button style={s.cancelBtn} onClick={() => setIsEditMode(false)} disabled={isSubmitting}>Отмена</button>
                                                        <button style={s.submitBtn} onClick={handleEditSave} disabled={isSubmitting}>
                                                            {isSubmitting ? '...' : 'Сохранить'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {!isEditMode ? (
                                                <div style={s.dataGrid}>
                                                    <div><span style={s.dataLabel}>Источник</span><span style={s.dataValue}>{LEAD_SOURCE_LABELS[details.source] || details.source}</span></div>
                                                    <div><span style={s.dataLabel}>Курс</span><span style={s.dataValue}>{details.interestedCourseName || '—'}</span></div>
                                                    <div><span style={s.dataLabel}>Создан</span><span style={s.dataValue}>{new Date(details.createdAt).toLocaleDateString('ru-RU')}</span></div>
                                                    <div><span style={s.dataLabel}>Обновлён</span><span style={s.dataValue}>{details.updatedAt ? new Date(details.updatedAt).toLocaleDateString('ru-RU') : '—'}</span></div>
                                                    {details.notes && (
                                                        <div style={{ gridColumn: '1 / -1' }}>
                                                            <span style={s.dataLabel}>Заметки</span>
                                                            <span style={s.dataValue}>{details.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                                    <input style={s.input} value={editForm.fullName} placeholder="ФИО"
                                                        onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
                                                    <input style={s.input} value={editForm.phone} placeholder="Телефон"
                                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                                    <input style={s.input} value={editForm.email} placeholder="Email"
                                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                                    <select style={s.input} value={editForm.source}
                                                        onChange={e => setEditForm({ ...editForm, source: Number(e.target.value) })}>
                                                        {Object.entries(LEAD_SOURCE).map(([key, value]) => (
                                                            <option key={value} value={value}>{LEAD_SOURCE_LABELS[key]}</option>
                                                        ))}
                                                    </select>
                                                    <select style={s.input} value={editForm.interestedCourseId}
                                                        onChange={e => setEditForm({ ...editForm, interestedCourseId: Number(e.target.value) })}>
                                                        <option value={0}>-- Курс не выбран --</option>
                                                        {courses.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                    </select>
                                                    <textarea style={{ ...s.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                                                        placeholder="Заметки"
                                                        value={editForm.notes}
                                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                                                </div>
                                            )}
                                        </div>

                                        <div style={s.section}>
                                            <div style={s.sectionTitle}>Сменить статус</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                                <select style={s.input} value={newStatus}
                                                    onChange={e => setNewStatus(Number(e.target.value))}>
                                                    {Object.entries(LEAD_STATUS).map(([key, value]) => (
                                                        <option key={value} value={value}>{LEAD_STATUS_LABELS[key]}</option>
                                                    ))}
                                                </select>
                                                {newStatus === LEAD_STATUS.Lost && (
                                                    <input style={s.input} placeholder="Причина потери"
                                                        value={lostReason} onChange={e => setLostReason(e.target.value)} />
                                                )}
                                                <input style={s.input} placeholder="Комментарий (опционально)"
                                                    value={statusComment} onChange={e => setStatusComment(e.target.value)} />
                                                <button style={s.submitBtn} onClick={handleStatusChange}
                                                    disabled={isSubmitting || newStatus === getStatusNum(details.status)}>
                                                    Применить
                                                </button>
                                            </div>
                                        </div>

                                        <div style={s.section}>
                                            <div style={s.sectionTitle}>Менеджер</div>
                                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                <select style={{ ...s.input, flex: 1 }} value={newManagerId}
                                                    onChange={e => setNewManagerId(Number(e.target.value))}>
                                                    <option value={0}>-- Не назначен --</option>
                                                    {managers.map(m => (
                                                        <option key={`${m.role}-${m.id}`} value={m.id}>
                                                            {m.fullName} ({m.role})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button style={s.submitBtn} onClick={handleAssign}
                                                    disabled={isSubmitting || newManagerId === 0 || newManagerId === details.assignedManagerId}>
                                                    <UserCheck size={14} /> Назначить
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                                        <div style={s.section}>
                                            <div style={s.sectionTitle}>Новое касание</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                                <select style={s.input} value={activityType}
                                                    onChange={e => setActivityType(e.target.value)}>
                                                    <option value="note">Заметка</option>
                                                    <option value="call">Звонок</option>
                                                    <option value="message">Сообщение</option>
                                                    <option value="meeting">Встреча</option>
                                                </select>
                                                <textarea
                                                    style={{ ...s.input, minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                                                    placeholder="Что произошло..."
                                                    value={activityText}
                                                    onChange={e => setActivityText(e.target.value)}
                                                />
                                                <button style={s.submitBtn} onClick={handleAddActivity}
                                                    disabled={isSubmitting || !activityText.trim()}>
                                                    <MessageCircle size={14} /> Добавить
                                                </button>
                                            </div>
                                        </div>

                                        <div style={s.section}>
                                            <div style={s.sectionTitle}>История</div>
                                            {details.activities.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px' }}>
                                                    Касаний пока не было
                                                </div>
                                            ) : (
                                                <div style={s.timeline}>
                                                    {details.activities.map(a => (
                                                        <div key={a.id} style={s.activityItem}>
                                                            <div style={s.activityDot} />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A' }}>
                                                                        {a.userFullName}
                                                                        <span style={{ marginLeft: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                                                                            · {activityTypeLabel(a.type)}
                                                                        </span>
                                                                    </span>
                                                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                                                                        {new Date(a.createdAt).toLocaleString('ru-RU')}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '13px', color: '#475569' }}>{a.description}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function getStatusNum(status: string): number { return (LEAD_STATUS as any)[status] || 0; }
function getSourceNum(source: string): number { return (LEAD_SOURCE as any)[source] || 0; }
function activityTypeLabel(type: string): string {
    const map: Record<string, string> = {
        note: 'Заметка', call: 'Звонок', message: 'Сообщение',
        meeting: 'Встреча', status_change: 'Смена статуса',
        assign: 'Назначение', system: 'Система',
    };
    return map[type] || type;
}

const s = {
    page: { padding: '24px 32px', background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } as React.CSSProperties,
    title: { fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' } as React.CSSProperties,
    subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' } as React.CSSProperties,
    plusBadge: { position: 'absolute' as const, top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' } as React.CSSProperties,
    metricsGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: '20px', marginBottom: '24px' } as React.CSSProperties,
    controls: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const } as React.CSSProperties,
    searchWrap: { position: 'relative' as const, flex: '1 1 280px' },
    searchIcon: { position: 'absolute' as const, left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
    searchInput: { width: '100%', padding: '10px 14px 10px 40px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', background: '#FFFFFF', outline: 'none', boxSizing: 'border-box' as const },
    filterSelect: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', background: '#FFFFFF', outline: 'none', minWidth: '180px' } as React.CSSProperties,
    loadingState: { display: 'flex', justifyContent: 'center', padding: '60px' } as React.CSSProperties,
    spinner: { color: '#6366F1', animation: 'spin 1s linear infinite' } as React.CSSProperties,
    emptyState: { textAlign: 'center' as const, padding: '60px 24px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0' },
    tableWrap: { background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, textAlign: 'left' as const },
    thRow: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
    th: { padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.04em' } as React.CSSProperties,
    tr: { borderBottom: '1px solid #F1F5F9' } as React.CSSProperties,
    td: { padding: '14px 16px', fontSize: '13px', color: '#334155', verticalAlign: 'middle' } as React.CSSProperties,
    badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 } as React.CSSProperties,
    sourcePill: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    editBtn: { padding: '6px 8px', background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748B', borderRadius: '8px', transition: 'all 0.15s' } as React.CSSProperties,
    deleteBtnRow: { padding: '6px 8px', background: '#FFFFFF', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#94A3B8', borderRadius: '8px', transition: 'all 0.15s' } as React.CSSProperties,
    pagination: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '20px' } as React.CSSProperties,
    pageArrow: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '10px', cursor: 'pointer', color: '#64748B' } as React.CSSProperties,
    pageBtnSquare: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' } as React.CSSProperties,
    pageBtnActive: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#4F46E5', color: '#FFFFFF', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 } as React.CSSProperties,
    pageDots: { padding: '0 6px', color: '#94A3B8', fontWeight: 600 } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#FFFFFF', borderRadius: '24px', width: '460px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', position: 'relative' as const } as React.CSSProperties,
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#0F172A' } as React.CSSProperties,
    modalSubtitle: { margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' } as React.CSSProperties,
    closeIcon: { position: 'absolute' as const, top: '20px', right: '20px', background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties,
    label: { fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' } as React.CSSProperties,
    input: { width: '100%', height: '44px', padding: '0 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '14px', outline: 'none', color: '#0F172A', boxSizing: 'border-box' as const } as React.CSSProperties,
    cancelBtn: { padding: '10px 18px', border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: '#475569' } as React.CSSProperties,
    submitBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 18px', background: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' } as React.CSSProperties,
    delIconWrap: { width: '44px', height: '44px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as React.CSSProperties,
    delWarnBox: { padding: '14px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '12px', color: '#64748B', fontSize: '13px', lineHeight: '1.5' } as React.CSSProperties,
    tabsBar: { display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '10px', marginTop: '20px' } as React.CSSProperties,
    tabBtn: { flex: 1, padding: '8px 14px', border: 'none', background: 'transparent', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer', borderRadius: '6px' } as React.CSSProperties,
    tabBtnActive: { background: '#FFFFFF', color: '#0F172A', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' } as React.CSSProperties,
    section: { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' } as React.CSSProperties,
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
    sectionTitle: { fontSize: '14px', fontWeight: 700, color: '#0F172A' } as React.CSSProperties,
    dataGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginTop: '12px' } as React.CSSProperties,
    dataLabel: { display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '2px' } as React.CSSProperties,
    dataValue: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A' } as React.CSSProperties,
    iconBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' } as React.CSSProperties,
    timeline: { display: 'flex', flexDirection: 'column' as const, gap: '14px', marginTop: '12px' } as React.CSSProperties,
    activityItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' } as React.CSSProperties,
    activityDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#4F46E5', marginTop: '6px', flexShrink: 0 } as React.CSSProperties,
};

export default LeadsPage;