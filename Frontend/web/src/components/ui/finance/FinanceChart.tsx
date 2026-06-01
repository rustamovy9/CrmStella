// pages/Finance/components/FinanceChart.tsx
import React, { useState, useMemo } from 'react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceChartProps {
    payments: PaymentListItem[];
}

// ─── ТИПЫ И КОНСТАНТЫ ─────────────────────────────────────────────────────

type Period = 'week' | 'month' | 'year';

type PaymentCategory = 'payment' | 'debt' | 'refund' | 'bonus' | 'discount';

interface CategoryConfig {
    key: PaymentCategory;
    label: string;
    color: string;
    matches: string[];
}

const CATEGORIES: CategoryConfig[] = [
    { key: 'payment',  label: 'Оплаты',   color: '#0284c7', matches: ['payment', 'income', '1', '0', 'оплата', 'доход'] },
    { key: 'debt',     label: 'Долги',    color: '#F59E0B', matches: ['debt', '2', 'долг'] },
    { key: 'refund',   label: 'Возвраты', color: '#f43f5e', matches: ['refund', '3', 'возврат', 'expense'] },
    { key: 'bonus',    label: 'Бонусы',   color: '#8B5CF6', matches: ['bonus', '4', 'бонус'] },
    { key: 'discount', label: 'Скидки',   color: '#0EA5E9', matches: ['discount', '5', 'скидка'] },
];

const MONTHS_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ─── HELPERS ──────────────────────────────────────────────────────────────

const getCategoryKey = (p: any): PaymentCategory | null => {
    if (!p.type) return 'payment';
    const t = String(p.type).toLowerCase();
    for (const cat of CATEGORIES) {
        if (cat.matches.includes(t)) return cat.key;
    }
    return null;
};

const checkIsConfirmed = (p: any): boolean => {
    if (p.isConfirmed === true || p.isConfirmed === 'true') return true;
    if (p.status) {
        const s = String(p.status).toLowerCase();
        return s === 'проведен' || s === 'completed' || s === 'success' || s === 'approved';
    }
    return false;
};

const getPaymentDate = (p: any): Date | null => {
    const d = p.date || p.createdAt || p.paymentDate;
    if (!d) return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
};

const getMondayOf = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────────

export const FinanceChart: React.FC<FinanceChartProps> = ({ payments }) => {
    const [period, setPeriod] = useState<Period>('week');
    const [activeCategories, setActiveCategories] = useState<Set<PaymentCategory>>(
        new Set(['payment', 'debt', 'refund', 'bonus', 'discount']) 
    );

    // Стейт для группового тултипа
    const [tooltip, setTooltip] = useState<{
        x: number;
        xLabel: string;
        items: Array<{ label: string; val: number; color: string }>;
    } | null>(null);

    const availableYears = useMemo(() => {
        const set = new Set<number>();
        payments.forEach(p => {
            if (!checkIsConfirmed(p)) return;
            const d = getPaymentDate(p);
            if (d) set.add(d.getFullYear());
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [payments]);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

    const activeYear = availableYears.includes(selectedYear)
        ? selectedYear
        : (availableYears.length > 0 ? availableYears[0] : currentYear);

    // ─── РАСЧЁТ ДАННЫХ ПО ПЕРИОДУ ────────────────────────────────────────

    const { bucketsByCategory, xLabels, periodLabel } = useMemo(() => {
        const result: Record<PaymentCategory, number[]> = {
            payment: [], debt: [], refund: [], bonus: [], discount: [],
        };

        let labels: string[] = [];
        let label = '';

        if (period === 'year') {
            CATEGORIES.forEach(c => result[c.key] = Array(12).fill(0));
            labels = MONTHS_RU;
            label = `за ${activeYear} год`;

            payments.forEach(p => {
                if (!checkIsConfirmed(p)) return;
                const d = getPaymentDate(p);
                if (!d || d.getFullYear() !== activeYear) return;
                const cat = getCategoryKey(p);
                if (!cat) return;
                result[cat][d.getMonth()] += Number(p.amount) || 0;
            });
        }
        else if (period === 'month') {
            const daysInMonth = new Date(activeYear, selectedMonth + 1, 0).getDate();
            CATEGORIES.forEach(c => result[c.key] = Array(daysInMonth).fill(0));
            labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
            label = `за ${MONTHS_RU[selectedMonth]} ${activeYear}`;

            payments.forEach(p => {
                if (!checkIsConfirmed(p)) return;
                const d = getPaymentDate(p);
                if (!d || d.getFullYear() !== activeYear || d.getMonth() !== selectedMonth) return;
                const cat = getCategoryKey(p);
                if (!cat) return;
                result[cat][d.getDate() - 1] += Number(p.amount) || 0;
            });
        }
        else { 
            const monday = getMondayOf(new Date());
            CATEGORIES.forEach(c => result[c.key] = Array(7).fill(0));
            labels = WEEKDAYS_RU;

            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);
            label = `с ${monday.getDate()}.${String(monday.getMonth() + 1).padStart(2, '0')} по ${sunday.getDate()}.${String(sunday.getMonth() + 1).padStart(2, '0')}`;

            payments.forEach(p => {
                if (!checkIsConfirmed(p)) return;
                const d = getPaymentDate(p);
                if (!d) return;
                const diff = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
                if (diff < 0 || diff > 6) return;
                const cat = getCategoryKey(p);
                if (!cat) return;
                result[cat][diff] += Number(p.amount) || 0;
            });
        }

        return { bucketsByCategory: result, xLabels: labels, periodLabel: label };
    }, [payments, period, activeYear, selectedMonth]);

    // ─── РАСЧЁТ МАСШТАБА И ГЕОМЕТРИИ ─────────────────────────────────────

    const visibleBuckets = CATEGORIES
        .filter(c => activeCategories.has(c.key))
        .map(c => bucketsByCategory[c.key]);

    const allValues = visibleBuckets.flat();
    const highestVal = Math.max(...allValues, 1000);
    const maxAmount = Math.ceil(highestVal / 1000) * 1000;

    const bucketCount = xLabels.length;
    const svgWidth = 900;
    const svgHeight = 240;
    const paddingLeft = 85;
    const paddingRight = 30;
    const graphWidth = svgWidth - paddingLeft - paddingRight;
    const zeroY = 200;
    const minY = 30;
    const graphHeight = zeroY - minY;

    const stepX = bucketCount > 1 ? graphWidth / (bucketCount - 1) : graphWidth;

    const generateSmoothPath = (data: number[]) => {
        if (data.length === 0) return { line: '', area: '', points: [] };

        const points = data.map((val, index) => ({
            x: paddingLeft + index * stepX,
            y: zeroY - (val / maxAmount) * graphHeight,
        }));

        let line = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX = p0.x + (p1.x - p0.x) / 2;
            line += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        const area = `${line} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;
        return { line, area, points };
    };

    const labelStep = bucketCount > 15 ? Math.ceil(bucketCount / 10) : 1;

    const toggleCategory = (key: PaymentCategory) => {
        setActiveCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (next.size > 1) next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // ─── RENDER ──────────────────────────────────────────────────────────

    return (
        <div style={s.wrapper}>
            <style>{`
                .fc-tab { padding: 6px 14px; font-size: 13px; font-weight: 500; color: #64748B; background: transparent; border: none; cursor: pointer; border-radius: 8px; transition: all 0.15s ease; }
                .fc-tab:hover { background: #F1F5F9; color: #334155; }
                .fc-tab.active { background: #FFFFFF; color: #0F172A; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .fc-legend { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; cursor: pointer; user-select: none; transition: all 0.15s; background: transparent; border: 1px solid transparent; }
                .fc-legend:hover { background: #F8FAFC; }
                .fc-legend.inactive { opacity: 0.4; }
                .fc-legend.inactive:hover { opacity: 0.7; }
            `}</style>

            <div style={s.header}>
                <div>
                    <h3 style={s.title}>Финансовый обзор</h3>
                    <p style={s.subtitle}>Динамика {periodLabel} (подтверждённые операции)</p>
                </div>

                <div style={s.tabs}>
                    <button className={`fc-tab ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Неделя</button>
                    <button className={`fc-tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Месяц</button>
                    <button className={`fc-tab ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>Год</button>
                </div>
            </div>

            <div style={s.controlsRow}>
                <div style={s.legendRow}>
                    {CATEGORIES.map(cat => {
                        const active = activeCategories.has(cat.key);
                        return (
                            <div key={cat.key} className={`fc-legend ${active ? '' : 'inactive'}`} onClick={() => toggleCategory(cat.key)}>
                                <span style={{ ...s.lineIndicator, backgroundColor: cat.color }} />
                                <span style={s.legendText}>{cat.label}</span>
                            </div>
                        );
                    })}
                </div>

                {period === 'month' && (
                    <div style={s.selectors}>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={s.dropdown}>
                            {MONTHS_RU.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select value={activeYear} onChange={e => setSelectedYear(Number(e.target.value))} style={s.dropdown}>
                            {availableYears.length > 0 ? availableYears.map(y => <option key={y} value={y}>{y}</option>) : <option value={currentYear}>{currentYear}</option>}
                        </select>
                    </div>
                )}

                {period === 'year' && (
                    <div style={s.selectors}>
                        <select value={activeYear} onChange={e => setSelectedYear(Number(e.target.value))} style={s.dropdown}>
                            {availableYears.length > 0 ? availableYears.map(y => <option key={y} value={y}>{y} год</option>) : <option value={currentYear}>{currentYear} год</option>}
                        </select>
                    </div>
                )}
            </div>

            <div style={{ width: '100%', overflowX: 'auto', marginTop: '12px', position: 'relative' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', display: 'block' }} onMouseLeave={() => setTooltip(null)}>
                    <defs>
                        {CATEGORIES.map(cat => (
                            <linearGradient key={cat.key} id={`grad-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={cat.color} stopOpacity="0.18" />
                                <stop offset="100%" stopColor={cat.color} stopOpacity="0.00" />
                            </linearGradient>
                        ))}
                    </defs>

                    {/* Сетка */}
                    <g stroke="#F1F5F9" strokeWidth="1">
                        <line x1={paddingLeft} y1={minY} x2={svgWidth - paddingRight} y2={minY} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.75} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.75} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.5} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.5} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.25} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.25} />
                        <line x1={paddingLeft} y1={zeroY} x2={svgWidth - paddingRight} y2={zeroY} stroke="#E2E8F0" strokeWidth="1.5" />
                    </g>

                    {/* Вертикальная направляющая линия активной точки */}
                    {tooltip && (
                        <line 
                            x1={tooltip.x} 
                            y1={minY} 
                            x2={tooltip.x} 
                            y2={zeroY} 
                            stroke="#CBD5E1" 
                            strokeWidth="1" 
                            strokeDasharray="4 4" 
                        />
                    )}

                    {/* Подписи Y */}
                    <g fontSize="11" fill="#94A3B8" textAnchor="end" fontFamily="inherit" fontWeight="500">
                        <text x={paddingLeft - 12} y={minY + 4}>{maxAmount.toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.75 + 4}>{(maxAmount * 0.75).toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.5 + 4}>{(maxAmount * 0.5).toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.25 + 4}>{(maxAmount * 0.25).toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY + 4}>0 TJS</text>
                    </g>

                    {/* Отрисовка линий и заливок */}
                    {maxAmount > 0 && CATEGORIES.map(cat => {
                        if (!activeCategories.has(cat.key)) return null;
                        const data = bucketsByCategory[cat.key];
                        const spline = generateSmoothPath(data);

                        return (
                            <g key={cat.key}>
                                <path d={spline.area} fill={`url(#grad-${cat.key})`} />
                                <path d={spline.line} fill="none" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" />
                                {spline.points.map((pt, idx) => data[idx] > 0 && (
                                    <circle
                                        key={`${cat.key}-${idx}`}
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="3.5"
                                        fill="#FFFFFF"
                                        stroke={cat.color}
                                        strokeWidth="2"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                ))}
                            </g>
                        );
                    })}

                    {/* Подписи X */}
                    <g fontSize="11" fill="#64748B" textAnchor="middle" fontWeight="500">
                        {xLabels.map((label, idx) => {
                            if (idx % labelStep !== 0 && idx !== xLabels.length - 1) return null;
                            const x = paddingLeft + idx * stepX;
                            return <text key={idx} x={x} y={zeroY + 22}>{label}</text>;
                        })}
                    </g>

                    {/* Интерактивные вертикальные зоны наведения (Во всю высоту) */}
                    {xLabels.map((label, idx) => {
                        const x = paddingLeft + idx * stepX;
                        // Вычисляем ширину зоны шага X
                        const zoneWidth = bucketCount > 1 ? graphWidth / (bucketCount - 1) : graphWidth;
                        
                        return (
                            <rect
                                key={`zone-${idx}`}
                                x={x - zoneWidth / 2}
                                y={minY}
                                width={zoneWidth}
                                height={graphHeight}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => {
                                    // Собираем все не нулевые значения активных категорий для этого шага
                                    const items: any[] = [];
                                    CATEGORIES.forEach(cat => {
                                        if (activeCategories.has(cat.key)) {
                                            const val = bucketsByCategory[cat.key][idx] || 0;
                                            if (val > 0) {
                                                items.push({ label: cat.label, val, color: cat.color });
                                            }
                                        }
                                    });

                                    if (items.length > 0) {
                                        setTooltip({ x, xLabel: label, items });
                                    } else {
                                        setTooltip(null);
                                    }
                                }}
                            />
                        );
                    })}
                </svg>

                {/* Исправленный и центрированный Тултип рядом с осью */}
                {tooltip && (
                    <div style={{
                        position: 'absolute',
                        left: tooltip.x,
                        top: minY + 10,
                        transform: tooltip.x > (svgWidth / 2) ? 'translate(-105%, 0)' : 'translate(5%, 0)',
                        background: 'rgba(30, 41, 59, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                        zIndex: 10,
                        transition: 'left 0.1s ease, top 0.1s ease',
                    }}>
                        <div style={{ fontWeight: 600, color: '#94A3B8', fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
                            Период: {tooltip.xLabel}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {tooltip.items.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                                        {item.label}
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{item.val.toLocaleString()} TJS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── СТИЛИ ────────────────────────────────────────────────────────────────

const s = {
    wrapper: {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        marginBottom: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    } as React.CSSProperties,

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
        gap: '16px',
    } as React.CSSProperties,

    title: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#0F172A',
        margin: 0,
    } as React.CSSProperties,

    subtitle: {
        fontSize: '13px',
        color: '#64748B',
        margin: '4px 0 0 0',
    } as React.CSSProperties,

    tabs: {
        display: 'inline-flex',
        gap: '4px',
        padding: '4px',
        background: '#F1F5F9',
        borderRadius: '10px',
    } as React.CSSProperties,

    controlsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap' as const,
        marginBottom: '8px',
    } as React.CSSProperties,

    legendRow: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap' as const,
    } as React.CSSProperties,

    selectors: {
        display: 'flex',
        gap: '8px',
    } as React.CSSProperties,

    lineIndicator: {
        width: '12px',
        height: '4px',
        borderRadius: '2px',
    } as React.CSSProperties,

    legendText: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#475569',
    } as React.CSSProperties,

    dropdown: {
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 500,
        color: '#334155',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        outline: 'none',
        cursor: 'pointer',
    } as React.CSSProperties,
};