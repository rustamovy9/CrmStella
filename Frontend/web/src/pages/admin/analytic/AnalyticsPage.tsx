// Pages/AnalyticsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Users, Filter, ChevronLeft, ChevronRight,
    RefreshCw, Layers, Calendar, Search
} from 'lucide-react';
import analyticsService from '../../../api/analyticsService'; // Путь к сервису
import type { AuditLogResponse, UsersByRoleResponse } from '../../../types/analytics';
// Импортируем премиальный компонент карточек
import { PremiumMetricCard } from '../../../components/ui/PremiumMetricCard'; 

export const AnalyticsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogResponse[]>([]);
    const [rolesData, setRolesData] = useState<UsersByRoleResponse[]>([]);

    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Синхронизируем переменные с твоим шаблоном пагинации
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    
    // Динамический расчёт totalPages на основе приходящих логов
    const totalPages = logs.length < pageSize ? currentPage : currentPage + 1;

    const [userId, setUserId] = useState('');
    const [entityName, setEntityName] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchRolesAnalytics = useCallback(async () => {
        setLoadingRoles(true);
        try {
            const data = await analyticsService.getUsersByRole();
            setRolesData(data);
        } catch (err) {
            console.error('Ошибка загрузки структуры пользователей', err);
        } finally {
            setLoadingRoles(false);
        }
    }, []);

    const fetchAuditLogs = useCallback(async () => {
        setLoadingLogs(true);
        setError(null);
        try {
            const res = await analyticsService.getAuditLogs({
                userId: userId ? Number(userId) : undefined,
                entityName: entityName || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                page: currentPage,
                pageSize,
            });
            if (res.data.isSuccess && res.data.data) setLogs(res.data.data);
            else setError(res.data.error || 'Не удалось загрузить логи');
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Ошибка сети при получении логов');
        } finally {
            setLoadingLogs(false);
        }
    }, [userId, entityName, fromDate, toDate, currentPage]);

    useEffect(() => { fetchRolesAnalytics(); }, [fetchRolesAnalytics]);
    useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

    const handleResetFilters = () => {
        setUserId(''); setEntityName(''); setFromDate(''); setToDate(''); setCurrentPage(1);
    };

    const totalUsers = rolesData.reduce((acc, r) => acc + (r.count || 0), 0);
    const uniqueEntities = new Set(logs.map((l) => l.entityName)).size;

    return (
        <div style={styles.container}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } } 
                .spin-animation { animation: spin 0.8s linear infinite; }
                
                .crm-input {
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .crm-input:focus {
                    border-color: #4F46E5 !important;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
                }
                
                /* Плавный ховер для твоих квадратных кнопок */
                .crm-square-btn {
                    transition: all 0.2s ease-in-out;
                }
                .crm-square-btn:hover:not(:disabled) {
                    background-color: #F8FAFC !important;
                    border-color: #CBD5E1 !important;
                }
            `}</style>

            {/* Заголовок */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Аналитика и отчёты</h2>
                    <p style={styles.subtitle}>Мониторинг активности системы и структуры пользователей</p>
                </div>
                <button
                    onClick={() => { fetchRolesAnalytics(); fetchAuditLogs(); }}
                    style={styles.refreshBtn}
                >
                    <RefreshCw size={15} className={loadingLogs || loadingRoles ? 'spin-animation' : ''} />
                    <span>Обновить данные</span>
                </button>
            </div>

            {/* Сетка метрик */}
            <div style={styles.statsGrid}>
                <PremiumMetricCard 
                    isMain={true}
                    label="Всего пользователей" 
                    value={loadingRoles ? '…' : totalUsers.toString()} 
                    subLabel="По всем ролям системы"
                    icon={<Users size={20} />}
                />

                <PremiumMetricCard 
                    variant="green"
                    label="Записей в журнале" 
                    value={logs.length.toString()} 
                    subLabel="На текущей странице"
                    icon={<Activity size={20} />}
                />

                <PremiumMetricCard 
                    variant="blue"
                    label="Активных ролей" 
                    value={rolesData.length.toString()} 
                    subLabel="Типов пользователей"
                    icon={<Layers size={20} />}
                />

                <PremiumMetricCard 
                    variant="purple"
                    label="Сущностей в выборке" 
                    value={uniqueEntities.toString()} 
                    subLabel="Уникальных типов"
                    icon={<Filter size={20} />}
                />
            </div>

            {/* Структура пользователей */}
            <div style={{ ...styles.card, marginTop: 24 }}>
                <div style={styles.cardHeader}>
                    <div style={styles.iconWrapBlue}><Users size={18} color="#4F46E5" /></div>
                    <h3 style={styles.cardTitle}>Структура пользователей</h3>
                </div>
                {loadingRoles ? (
                    <div style={styles.loader}>Загрузка структуры…</div>
                ) : rolesData.length === 0 ? (
                    <div style={styles.emptyText}>Нет данных о пользователях</div>
                ) : (
                    <div style={styles.chartContainer}>
                        {rolesData.map((item, i) => {
                            const pct = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
                            return (
                                <div key={i} style={styles.chartRow}>
                                    <div style={styles.chartLabelRow}>
                                        <span style={styles.roleName}>{item.role || 'Без роли'}</span>
                                        <span style={styles.roleCount}>{item.count} чел. · {pct}%</span>
                                    </div>
                                    <div style={styles.barOuter}>
                                        <div style={{ ...styles.barInner, width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Журнал аудита */}
            <div style={{ ...styles.card, marginTop: 24, paddingBottom: 16 }}>
                <div style={styles.cardHeader}>
                    <div style={styles.iconWrapPurple}><Activity size={18} color="#8B5CF6" /></div>
                    <h3 style={styles.cardTitle}>Журнал действий</h3>
                </div>

                {/* Панель фильтров */}
                <div style={styles.filterBar}>
                    <div style={styles.filterGroup}>
                        <div style={styles.inputWrapper}>
                            <Search size={15} color="#94A3B8" style={styles.inputIcon} />
                            <input 
                                type="number" 
                                placeholder="ID пользователя" 
                                value={userId}
                                onChange={(e) => { setUserId(e.target.value); setCurrentPage(1); }} 
                                className="crm-input"
                                style={{ ...styles.input, paddingLeft: '34px' }} 
                            />
                        </div>
                        
                        <div style={styles.inputWrapper}>
                            <Filter size={15} color="#94A3B8" style={styles.inputIcon} />
                            <input 
                                type="text" 
                                placeholder="Сущность (напр. Student)" 
                                value={entityName}
                                onChange={(e) => { setEntityName(e.target.value); setCurrentPage(1); }} 
                                className="crm-input"
                                style={{ ...styles.input, paddingLeft: '34px' }} 
                            />
                        </div>

                        <div style={styles.inputWrapper}>
                            <Calendar size={15} color="#94A3B8" style={styles.inputIcon} />
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }} 
                                className="crm-input"
                                style={{ ...styles.input, paddingLeft: '34px', color: fromDate ? '#334155' : '#94A3B8' }} 
                            />
                        </div>

                        <div style={styles.inputWrapper}>
                            <Calendar size={15} color="#94A3B8" style={styles.inputIcon} />
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }} 
                                className="crm-input"
                                style={{ ...styles.input, paddingLeft: '34px', color: toDate ? '#334155' : '#94A3B8' }} 
                            />
                        </div>
                    </div>
                    
                    {(userId || entityName || fromDate || toDate) && (
                        <button onClick={handleResetFilters} style={styles.resetBtn}>Сбросить</button>
                    )}
                </div>

                {/* Таблица логов */}
                <div style={styles.tableContainer}>
                    {loadingLogs ? (
                        <div style={styles.tableLoader}>Загрузка записей журнала…</div>
                    ) : error ? (
                        <div style={styles.errorBanner}>{error}</div>
                    ) : logs.length === 0 ? (
                        <div style={styles.emptyText}>По заданным критериям действий не найдено</div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={{ ...styles.th, width: '90px' }}>ID</th>
                                    <th style={styles.th}>Пользователь</th>
                                    <th style={styles.th}>Сущность</th>
                                    <th style={{ ...styles.th, width: '120px' }}>ID сущности</th>
                                    <th style={styles.th}>Действие</th>
                                    <th style={{ ...styles.th, textAlign: 'right' }}>Дата и время</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => (
                                    <tr key={log.id ?? idx} style={styles.tbRow}>
                                        <td style={styles.td}><strong>#{log.id}</strong></td>
                                        <td style={styles.td}>{log.userName ?? 'Система'}</td>
                                        <td style={styles.td}><span style={styles.badgeEntity}>{log.entityName || '—'}</span></td>
                                        <td style={styles.td}>{log.entityId ?? '—'}</td>
                                        <td style={styles.td}>{log.action || '—'}</td>
                                        <td style={{ ...styles.tdStr, textAlign: 'right' }}>
                                            {log.createdAt ? new Date(log.createdAt).toLocaleString('ru-RU') : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* БЛОК ПАГИНАЦИИ (ТЕПЕРЬ СПРАВА) */}
                <div style={styles.paginationContainer}>
                    <button
                        className="crm-square-btn"
                        style={{
                            ...styles.pageSquareBtn,
                            opacity: currentPage === 1 ? 0.4 : 1,
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        <ChevronLeft size={16} color="#64748B" />
                    </button>

                    <button style={styles.pageSquareBtnActive}>{currentPage}</button>

                    <button
                        className="crm-square-btn"
                        style={{
                            ...styles.pageSquareBtn,
                            opacity: currentPage === totalPages ? 0.4 : 1,
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        <ChevronRight size={16} color="#64748B" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const BAR_COLORS = ['#4F46E5', '#10B981', '#8B5CF6', '#0EA5E9', '#F43F5E'];

const styles: Record<string, React.CSSProperties> = {
    container: { padding: 24, background: '#F8FAFC', minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' },
    refreshBtn: { background: '#FFF', color: '#475569', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: 10, fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },

    card: { background: '#FFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.03)', padding: 24 },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
    iconWrapBlue: { background: '#EEF2FF', padding: 8, borderRadius: 10, display: 'flex' },
    iconWrapPurple: { background: '#F5F3FF', padding: 8, borderRadius: 10, display: 'flex' },
    cardTitle: { fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 },

    chartContainer: { display: 'flex', flexDirection: 'column', gap: 14 },
    chartRow: { display: 'flex', flexDirection: 'column', gap: 6 },
    chartLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    roleName: { fontSize: '13px', fontWeight: 500, color: '#334155' },
    roleCount: { fontSize: '12px', fontWeight: 600, color: '#64748B' },
    barOuter: { width: '100%', height: 8, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
    barInner: { height: '100%', borderRadius: 999, transition: 'width 0.4s ease' },

    filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20, gap: 12, flexWrap: 'wrap' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '12px', pointerEvents: 'none' },
    input: { background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px 8px 12px', fontSize: '13px', color: '#334155', outline: 'none', width: '200px' },
    resetBtn: { background: 'none', border: 'none', color: '#EF4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer', padding: '4px 8px' },

    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    thRow: { borderBottom: '1px solid #E2E8F0' },
    th: { padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tbRow: { background: '#FFF', borderBottom: '1px solid #F1F5F9' },
    td: { padding: '14px 16px', fontSize: '13px', color: '#334155' },
    tdStr: { padding: '14px 16px', fontSize: '13px', color: '#64748B' },
    badgeEntity: { background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: 8, fontSize: '12px', fontWeight: 500 },

    loader: { textAlign: 'center', padding: 20, color: '#64748B', fontSize: '14px' },
    tableLoader: { textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: '14px' },
    emptyText: { textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: '13px' },
    errorBanner: { padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 10, fontSize: '13px', color: '#EF4444', textAlign: 'center' },
    
    // ИЗМЕНЕНО: Свойство justifyContent переключено на flex-end
    paginationContainer: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' },
    pageSquareBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 },
    pageSquareBtnActive: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)', cursor: 'default', padding: 0 }
};

export default AnalyticsPage;