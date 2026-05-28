import React, { useEffect, useState } from 'react';
import { Search, Filter, X, Clock, MapPin, Users, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MetricCard from '../../../components/ui/MetricCard';
import scheduleService from '../../../api/scheduleService';
import groupService from '../../../api/groupService';
import DeleteConfirmModal from '../../../components/modals/DeleteConfirmModal';
import type { ScheduleResponse, CreateScheduleRequest, UpdateScheduleRequest } from '../../../types/schedule';

// ─── Константы ────────────────────────────────────────────────────────────────

const CSHARP_DAY_OF_WEEK: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2,
    Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
};

const DAYS = [
    { key: 'Monday', label: 'Понедельник', short: 'Пн' },
    { key: 'Tuesday', label: 'Вторник', short: 'Вт' },
    { key: 'Wednesday', label: 'Среда', short: 'Ср' },
    { key: 'Thursday', label: 'Четверг', short: 'Чт' },
    { key: 'Friday', label: 'Пятница', short: 'Пт' },
    { key: 'Saturday', label: 'Суббота', short: 'Сб' },
    { key: 'Sunday', label: 'Воскресенье', short: 'Вс' },
];

// Цвета для групп (назначаются по groupId % длина)
const GROUP_PALETTE = [
    { bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
    { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
    { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
    { bg: '#FDF4FF', text: '#7E22CE', dot: '#A855F7' },
    { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
    { bg: '#F0FDFA', text: '#0F766E', dot: '#14B8A6' },
    { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308' },
];

const getGroupColor = (groupId: number) => GROUP_PALETTE[groupId % GROUP_PALETTE.length];

const formatTime = (t: string) => t?.slice(0, 5) ?? '—';
const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : null;

// ─── Компонент ────────────────────────────────────────────────────────────────

const SchedulesPage: React.FC = () => {
    const navigate = useNavigate();

    const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [dayFilter, setDayFilter] = useState('all');
    const [groupFilter, setGroupFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50; // Берём побольше — отображаем в таблице

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete modal
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

    const [formData, setFormData] = useState({
        groupId: '', dayOfWeek: 1,
        startTime: '', endTime: '',
        room: '',
        recurringFrom: new Date().toISOString().split('T')[0],
        recurringTo: ''
    });

    // ─── Load ─────────────────────────────────────────────────────────────────

    const loadGroups = async () => {
        try {
            const res = await groupService.getAll();
            if (res.data?.isSuccess) {
                const raw = res.data.data;
                const list = Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? [];
                setGroups(list);
            }
        } catch { /* молча */ }
    };

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            const dayNum = dayFilter !== 'all' ? CSHARP_DAY_OF_WEEK[dayFilter] : undefined;
            const res = await scheduleService.getAll({
                page: currentPage, pageSize,
                search: searchTerm || undefined,
                dayOfWeek: dayNum,
                groupId: groupFilter !== 'all' ? Number(groupFilter) : undefined
            });
            if (res.data?.isSuccess) {
                const d = res.data.data as any;
                setSchedules(d?.items ?? d?.data ?? []);
                setTotalCount(d?.totalCount ?? 0);
            } else {
                setError(res.data?.message || 'Не удалось загрузить расписание');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Сетевая ошибка');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadGroups(); }, []);

    useEffect(() => {
        const t = setTimeout(loadSchedules, 400);
        return () => clearTimeout(t);
    }, [searchTerm, dayFilter, groupFilter, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, dayFilter, groupFilter]);

    // ─── Группируем по дням для таблицы ──────────────────────────────────────
    const byDay: Record<string, ScheduleResponse[]> = {};
    DAYS.forEach(d => { byDay[d.key] = []; });
    schedules.forEach(s => {
        if (byDay[s.dayOfWeek]) byDay[s.dayOfWeek].push(s);
    });

    // Видимые дни (только те у кого есть занятия или все если фильтр = all)
    const visibleDays = dayFilter === 'all'
        ? DAYS
        : DAYS.filter(d => d.key === dayFilter);

    const maxRows = Math.max(...visibleDays.map(d => byDay[d.key].length), 1);

    const activeGroups = groups.filter(g =>
        g.status === 1 || g.status === 'Active' || g.isActive === true
    );

    // Метрики
    const roomsCount = new Set(schedules.map(s => s.room).filter(Boolean)).size;
    const todayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const todayCount = schedules.filter(s => s.dayOfWeek === todayKey).length;

    // ─── Modal helpers ────────────────────────────────────────────────────────

    const openCreate = () => {
        setModalMode('create');
        setFormData({
            groupId: '', dayOfWeek: 1, startTime: '', endTime: '', room: '',
            recurringFrom: new Date().toISOString().split('T')[0], recurringTo: ''
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEdit = (s: ScheduleResponse) => {
        setModalMode('edit');
        setSelectedItemId(s.id);
        setFormData({
            groupId: String(s.groupId),
            dayOfWeek: CSHARP_DAY_OF_WEEK[s.dayOfWeek] ?? 1,
            startTime: s.startTime?.slice(0, 5) ?? '',
            endTime: s.endTime?.slice(0, 5) ?? '',
            room: s.room ?? '',
            recurringFrom: s.recurringFrom?.split('T')[0] ?? '',
            recurringTo: s.recurringTo?.split('T')[0] ?? ''
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number, name: string) => {
        setItemToDelete({ id, name: name || `Занятие #${id}` });
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await scheduleService.delete(itemToDelete.id);
            if (res.data?.isSuccess) {
                setIsDeleteOpen(false);
                setItemToDelete(null);
                loadSchedules();
            }
        } catch { /* ignore */ }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        const fmt = (t: string) => t.includes(':') && t.split(':').length === 2 ? t + ':00' : t;
        try {
            if (modalMode === 'create') {
                const payload: CreateScheduleRequest = {
                    groupId: Number(formData.groupId),
                    dayOfWeek: formData.dayOfWeek,
                    startTime: fmt(formData.startTime),
                    endTime: fmt(formData.endTime),
                    room: formData.room || undefined,
                    recurringFrom: formData.recurringFrom,
                    recurringTo: formData.recurringTo || undefined
                };
                const res = await scheduleService.create(payload);
                if (res.data?.isSuccess) { setIsModalOpen(false); loadSchedules(); }
                else setFormError(res.data?.message || 'Ошибка при создании');
            } else if (selectedItemId) {
                const payload: UpdateScheduleRequest = {
                    dayOfWeek: formData.dayOfWeek,
                    startTime: fmt(formData.startTime),
                    endTime: fmt(formData.endTime),
                    room: formData.room || undefined,
                    recurringTo: formData.recurringTo || undefined
                };
                const res = await scheduleService.update(selectedItemId, payload);
                if (res.data?.isSuccess) { setIsModalOpen(false); loadSchedules(); }
                else setFormError(res.data?.message || 'Ошибка при обновлении');
            }
        } catch (err: any) {
            setFormError(err?.response?.data?.message || 'Ошибка сервера');
        } finally { setSubmitting(false); }
    };

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div style={s.page}>
            <style>{CSS}</style>

            {/* Header — Кнопка "Добавить" убрана, так как она есть в MetricCard */}
            <div style={{ ...s.headerRow, justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={s.title}>Расписание занятий</h2>
                    <p style={s.subtitle}>Еженедельное расписание учебных групп</p>
                </div>
            </div>

            {/* Metrics */}
            <div style={s.metricsRow}>
                <div onClick={openCreate} style={{ ...s.metricWrap, cursor: 'pointer' }} className="metric-hover">
                    <MetricCard isMain value={totalCount} label="ВСЕГО ЗАНЯТИЙ" subLabel="Нажмите, чтобы добавить" />
                </div>
                <div style={s.metricWrap}>
                    <MetricCard variant="blue" value={activeGroups.length} label="АКТИВНЫХ ГРУПП" subLabel="Доступно для расписания" />
                </div>
                <div style={s.metricWrap}>
                    <MetricCard variant="green" value={todayCount} label="СЕГОДНЯ" subLabel={`Занятий — ${DAYS.find(d => d.key === todayKey)?.label ?? ''}`} />
                </div>
                <div style={s.metricWrap}>
                    <MetricCard variant="amber" value={roomsCount} label="АУДИТОРИЙ" subLabel="Задействовано" />
                </div>
            </div>

            {/* Toolbar */}
            <div style={s.toolbar}>
                <div style={s.searchWrap}>
                    <Search size={16} style={s.searchIcon} />
                    <input
                        type="text" placeholder="Поиск по группе или аудитории..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={s.searchInput}
                    />
                </div>
                <div style={s.filterBox}>
                    <Filter size={14} color="#64748B" />
                    <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={s.sel}>
                        <option value="all">Все группы</option>
                        {activeGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name || `Группа #${g.id}`}</option>
                        ))}
                    </select>
                </div>
                <div style={s.filterBox}>
                    <Filter size={14} color="#64748B" />
                    <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} style={s.sel}>
                        <option value="all">Все дни</option>
                        {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Timetable */}
            {loading ? (
                <div style={s.center}>
                    <div style={s.spinner} className="spin" />
                    <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Загрузка расписания...</p>
                </div>
            ) : error ? (
                <div style={{ ...s.center, color: '#EF4444' }}>{error}</div>
            ) : schedules.length === 0 ? (
                <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📅</div>
                    <p style={s.emptyTitle}>Расписание пусто</p>
                    <p style={s.emptySub}>Нажмите на карточку «Всего занятий» выше, чтобы создать первую запись</p>
                </div>
            ) : (
                <div style={s.tableWrap}>
                    {/* ── Заголовки колонок ── */}
                    <div style={{ ...s.tableGrid, gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}>
                        {visibleDays.map(d => {
                            const count = byDay[d.key].length;
                            const isToday = d.key === todayKey;
                            return (
                                <div key={d.key} style={{
                                    ...s.colHeader,
                                    background: isToday ? '#4F46E5' : '#fff',
                                    color: isToday ? '#fff' : '#0F172A',
                                    border: isToday ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                                }}>
                                    <span style={s.colDay}>{d.label}</span>
                                    {count > 0 && (
                                        <span style={{
                                            ...s.colCount,
                                            background: isToday ? 'rgba(255,255,255,0.25)' : '#EEF2FF',
                                            color: isToday ? '#fff' : '#4F46E5',
                                        }}>
                                            {count}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Строки ── */}
                    {Array.from({ length: maxRows }, (_, rowIdx) => (
                        <div key={rowIdx} style={{ ...s.tableGrid, gridTemplateColumns: `repeat(${visibleDays.length}, 1fr)` }}>
                            {visibleDays.map(d => {
                                const slot = byDay[d.key][rowIdx];
                                if (!slot) return <div key={d.key} style={s.emptyCell} />;
                                const color = getGroupColor(slot.groupId);
                                return (
                                    <div key={d.key} style={{ ...s.slotCard, background: color.bg, borderLeft: `3px solid ${color.dot}` }}>
                                        {/* Время */}
                                        <div style={s.slotTime}>
                                            <div style={{ ...s.timeDot, background: color.dot }} />
                                            <span style={{ ...s.timeLabel, color: color.text }}>
                                                {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                                            </span>
                                        </div>

                                        {/* Название группы */}
                                        <p style={{ ...s.slotGroup, color: color.text }}>
                                            {slot.groupName || `Группа #${slot.groupId}`}
                                        </p>

                                        {/* Мета */}
                                        <div style={s.slotMeta}>
                                            {slot.room && (
                                                <span style={s.metaChip}>
                                                    <MapPin size={10} />{slot.room}
                                                </span>
                                            )}
                                            {(slot.recurringFrom || slot.recurringTo) && (
                                                <span style={s.metaChip}>
                                                    <Clock size={10} />
                                                    {formatDate(slot.recurringFrom)}
                                                    {slot.recurringTo ? ` — ${formatDate(slot.recurringTo)}` : ''}
                                                </span>
                                            )}
                                        </div>

                                        {/* Действия */}
                                        <div style={s.slotActions}>
                                            <button
                                                style={s.slotBtn}
                                                onClick={() => navigate(`/admin/groups/${slot.groupId}`)}
                                                title="Перейти к группе"
                                            >
                                                <Users size={11} color="#64748B" />
                                            </button>
                                            <button
                                                style={s.slotBtn}
                                                onClick={() => openEdit(slot)}
                                                title="Редактировать"
                                            >
                                                <Edit3 size={11} color="#64748B" />
                                            </button>
                                            <button
                                                style={{ ...s.slotBtn, background: '#FEF2F2' }}
                                                onClick={() => handleDeleteClick(slot.id, slot.groupName)}
                                                title="Удалить"
                                            >
                                                <Trash2 size={11} color="#EF4444" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={s.pagination}>
                    <span style={s.pageInfo}>Всего: {totalCount}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ ...s.pageBtn, opacity: currentPage === 1 ? 0.4 : 1 }}
                            disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                            <ChevronLeft size={15} color="#64748B" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((p, idx, arr) => (
                                <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#94A3B8', padding: '0 4px' }}>…</span>}
                                    <button onClick={() => setCurrentPage(p)}
                                        style={p === currentPage ? s.pageBtnActive : s.pageBtn}>
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))}
                        <button style={{ ...s.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1 }}
                            disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            <ChevronRight size={15} color="#64748B" />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div style={s.modal}>
                        <button style={s.closeBtn} onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                        <h3 style={s.modalTitle}>
                            {modalMode === 'create' ? 'Новое занятие' : 'Редактировать занятие'}
                        </h3>
                        <p style={s.modalSub}>
                            {modalMode === 'create' ? 'Заполните данные нового слота расписания' : 'Измените параметры занятия'}
                        </p>
                        {formError && (
                            <div style={s.formErr}>{formError}</div>
                        )}
                        <form onSubmit={handleSubmit} style={s.form}>
                            {/* Группа */}
                            <div style={s.field}>
                                <label style={s.label}>УЧЕБНАЯ ГРУППА</label>
                                <select required disabled={modalMode === 'edit'}
                                    style={{ ...s.input, cursor: 'pointer', opacity: modalMode === 'edit' ? 0.7 : 1 }}
                                    value={formData.groupId}
                                    onChange={e => setFormData({ ...formData, groupId: e.target.value })}>
                                    <option value="" disabled>— Выберите группу —</option>
                                    {activeGroups.map(g => (
                                        <option key={g.id} value={g.id}>
                                            {g.name || `Группа #${g.id}`}{g.courseName ? ` — ${g.courseName}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* День */}
                            <div style={s.field}>
                                <label style={s.label}>ДЕНЬ НЕДЕЛИ</label>
                                <select style={{ ...s.input, cursor: 'pointer' }}
                                    value={formData.dayOfWeek}
                                    onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}>
                                    {DAYS.map(d => (
                                        <option key={d.key} value={CSHARP_DAY_OF_WEEK[d.key]}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Время */}
                            <div style={s.row}>
                                <div style={s.field}>
                                    <label style={s.label}>НАЧАЛО</label>
                                    <input type="time" required style={s.input}
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div style={s.field}>
                                    <label style={s.label}>ОКОНЧАНИЕ</label>
                                    <input type="time" required style={s.input}
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            {/* Аудитория */}
                            <div style={s.field}>
                                <label style={s.label}>АУДИТОРИЯ (необязательно)</label>
                                <input type="text" style={s.input} placeholder="Каб. 204"
                                    value={formData.room}
                                    onChange={e => setFormData({ ...formData, room: e.target.value })} />
                            </div>
                            {/* Даты */}
                            <div style={s.row}>
                                <div style={s.field}>
                                    <label style={s.label}>ДАТА СТАРТА</label>
                                    <input type="date" required={modalMode === 'create'} style={s.input}
                                        disabled={modalMode === 'edit'}
                                        value={formData.recurringFrom}
                                        onChange={e => setFormData({ ...formData, recurringFrom: e.target.value })} />
                                </div>
                                <div style={s.field}>
                                    <label style={s.label}>ДАТА ОКОНЧАНИЯ</label>
                                    <input type="date" style={s.input}
                                        value={formData.recurringTo}
                                        onChange={e => setFormData({ ...formData, recurringTo: e.target.value })} />
                                </div>
                            </div>
                            <div style={s.modalActions}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={s.cancelBtn}>Отмена</button>
                                <button type="submit" disabled={submitting || !formData.groupId} style={{
                                    ...s.submitBtn,
                                    opacity: (submitting || !formData.groupId) ? 0.6 : 1
                                }}>
                                    {submitting ? 'Сохранение...' : modalMode === 'create' ? 'Создать занятие' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => { setIsDeleteOpen(false); setItemToDelete(null); }}
                onConfirm={handleConfirmDelete}
                groupName={itemToDelete?.name ?? ''}
            />
        </div>
    );
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }
    .metric-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .metric-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(79,70,229,0.2); }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
    page: { padding: '32px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#F8FAFC', minHeight: '100vh', boxSizing: 'border-box' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    title: { fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
    subtitle: { margin: 0, fontSize: '14px', color: '#64748B', fontWeight: 500 },
    addBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },

    metricsRow: { display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '28px', width: '100%', alignItems: 'stretch' },
    metricWrap: { flex: '1 1 220px', display: 'grid' },

    toolbar: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' },
    searchWrap: { position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' },
    searchIcon: { position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' },
    searchInput: { width: '100%', height: '42px', padding: '0 16px 0 40px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#fff', fontSize: '14px', outline: 'none', color: '#334155', boxSizing: 'border-box' },
    filterBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '0 14px', height: '42px' },
    sel: { border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: '#334155', fontWeight: 500, cursor: 'pointer' },

    center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '80px 0' },
    spinner: { width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTop: '3px solid #4F46E5', borderRadius: '50%' },

    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '80px 0', textAlign: 'center' },
    emptyIcon: { fontSize: '48px', lineHeight: 1 },
    emptyTitle: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' },
    emptySub: { margin: 0, fontSize: '14px', color: '#64748B' },

    // Timetable
    tableWrap: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
    tableGrid: { display: 'grid', gap: 0, borderBottom: '1px solid #F1F5F9' },
    colHeader: { padding: '14px 16px', borderRight: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
    colDay: { fontSize: '13px', fontWeight: 700, letterSpacing: '0.01em' },
    colCount: { padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 },

    // Slot card inside cell
    slotCard: { margin: '10px', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '110px', borderRight: '1px solid transparent' },
    slotTime: { display: 'flex', alignItems: 'center', gap: '6px' },
    timeDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
    timeLabel: { fontSize: '12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
    slotGroup: { margin: 0, fontSize: '13px', fontWeight: 700, lineHeight: 1.3 },
    slotMeta: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' },
    metaChip: { display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 500, color: '#64748B', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '5px', padding: '2px 6px' },
    slotActions: { display: 'flex', gap: '4px', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.06)' },
    slotBtn: { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
    emptyCell: { margin: '10px', borderRadius: '12px', minHeight: '110px', background: '#FAFAFA', border: '1px dashed #E5E7EB' },

    // Pagination
    pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' },
    pageInfo: { fontSize: '13px', color: '#64748B', fontWeight: 500 },
    pageBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' },
    pageBtnActive: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#4F46E5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#fff' },

    // Modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '20px', padding: '28px 32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
    closeBtn: { position: 'absolute', top: '18px', right: '18px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' },
    modalTitle: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' },
    modalSub: { margin: '0 0 18px 0', fontSize: '13px', color: '#64748B' },
    formErr: { padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#DC2626', fontSize: '13px', fontWeight: 500, marginBottom: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '14px' },
    row: { display: 'flex', gap: '12px' },
    field: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.5px' },
    input: { width: '100%', height: '42px', padding: '0 13px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', color: '#111827', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' },
    cancelBtn: { padding: '10px 20px', background: '#F1F5F9', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer' },
    submitBtn: { padding: '10px 22px', background: '#4F46E5', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' },
};

export default SchedulesPage;