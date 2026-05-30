// pages/Finance/components/FinanceChart.tsx
import React, { useState } from 'react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceChartProps {
    payments: PaymentListItem[];
}

export const FinanceChart: React.FC<FinanceChartProps> = ({ payments }) => {
    // Состояние для выбора активного года
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Инициализируем массивы для 12 месяцев (от 0 до 11)
    const monthlyIncome = Array(12).fill(0);
    const monthlyExpense = Array(12).fill(0);

    // Безопасный сбор доступных годов для выпадающего списка
    const yearsSet = new Set<number>();
    
    // Перебираем только те платежи, которые подтверждены администратором
    payments.forEach((p: any) => {
        // Исключаем из графиков операции, которые еще не прошли верификацию (isConfirmed === false)
        if (p.isConfirmed === false) return;

        const d = p.date || p.createdAt || p.paymentDate;
        if (d) {
            const yearNum = new Date(d).getFullYear();
            if (!isNaN(yearNum)) {
                yearsSet.add(yearNum);
            }
        }
    });
    
    // Исправление ошибки TS: гарантируем, что массив состоит только из валидных чисел
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
    
    // Если выбранного года нет в списке, берем самый свежий из доступных или текущий
    const activeYear = availableYears.includes(selectedYear) 
        ? selectedYear 
        : (availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());

    // Распределяем подтвержденные транзакции из API по месяцам
    payments.forEach((p: any) => {
        // ГВАРД-ХУК: Если платеж НЕ подтвержден, полностью игнорируем его при построении графиков тренда
        if (p.isConfirmed === false) return;

        const dateStr = p.date || p.createdAt || p.paymentDate;
        if (!dateStr) return;

        const date = new Date(dateStr);
        if (isNaN(date.getTime()) || date.getFullYear() !== activeYear) return;

        const month = date.getMonth(); // 0 = Янв, 11 = Дек
        const amount = Number(p.amount) || 0;
        const typeStr = String(p.type || '').toLowerCase();

        // Проверка типа операции (Доход / Расход) в соответствии с вашим API
        const isIncome = typeStr === 'income' || typeStr === 'payment' || typeStr === '0' || typeStr === 'доход' || !p.type;
        const isExpense = typeStr === 'expense' || typeStr === '1' || typeStr === 'расход';

        if (isIncome) {
            monthlyIncome[month] += amount;
        } else if (isExpense) {
            monthlyExpense[month] += amount;
        }
    });

    // Расчет динамической сетки шкалы Y
    const highestVal = Math.max(...monthlyIncome, ...monthlyExpense, 1000);
    // Округляем верхний предел до красивого кратного числа
    const maxAmount = Math.ceil(highestVal / 1000) * 1000;
    const midAmount = maxAmount / 2;
    const quarterAmount = maxAmount * 0.75;
    const lowAmount = maxAmount * 0.25;

    // Размеры графического холста SVG
    const svgWidth = 900;
    const svgHeight = 240;
    const paddingLeft = 85; // Немного увеличили отступ для крупных сумм на оси Y
    const paddingRight = 30;
    const graphWidth = svgWidth - paddingLeft - paddingRight;
    
    const zeroY = 200; // Позиция базовой линии нуля
    const minY = 30;   // Пиковая высота верхнего значения сетки
    const graphHeight = zeroY - minY;

    // Генератор плавных волнообразных линий (Cubic Bezier)
    const generateSmoothPath = (data: number[]) => {
        const points = data.map((val, index) => {
            const x = paddingLeft + index * (graphWidth / 11);
            const y = zeroY - (val / maxAmount * graphHeight);
            return { x, y };
        });

        if (points.length === 0) return { line: '', area: '', points: [] };

        let line = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpX1 = p0.x + (p1.x - p0.x) / 2;
            const cpY1 = p0.y;
            const cpX2 = p0.x + (p1.x - p0.x) / 2;
            const cpY2 = p1.y;
            
            line += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
        }

        const area = `${line} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`;
        return { line, area, points };
    };

    const incomeSpline = generateSmoothPath(monthlyIncome);
    const expenseSpline = generateSmoothPath(monthlyExpense);

    const monthsLabels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    return (
        <div style={styles.wrapper}>
            {/* Верхняя панель управления и легенда */}
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>Финансовый обзор</h3>
                    <p style={styles.subtitle}>Динамика реальных доходов и расходов за {activeYear} год (подтвержденные)</p>
                </div>
                
                <div style={styles.controlsRow}>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.lineIndicator, backgroundColor: '#0284c7' }} />
                        <span style={styles.legendText}>Доходы</span>
                    </div>
                    <div style={styles.legendItem}>
                        <span style={{ ...styles.lineIndicator, backgroundColor: '#f43f5e' }} />
                        <span style={styles.legendText}>Расходы</span>
                    </div>
                    
                    <select 
                        value={activeYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        style={styles.dropdown}
                    >
                        {availableYears.length > 0 ? (
                            availableYears.map(y => <option key={y} value={y}>{y} год</option>)
                        ) : (
                            <option value={new Date().getFullYear()}>{new Date().getFullYear()} год</option>
                        )}
                    </select>
                </div>
            </div>

            {/* Область SVG-графика */}
            <div style={{ width: '100%', overflowX: 'auto', marginTop: '10px' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', display: 'block' }}>
                    <defs>
                        {/* Синий градиент под линией доходов */}
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.00" />
                        </linearGradient>
                        {/* Розовый градиент под линией расходов */}
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.00" />
                        </linearGradient>
                    </defs>

                    {/* Горизонтальные линии координатной сетки */}
                    <g stroke="#F1F5F9" strokeWidth="1">
                        <line x1={paddingLeft} y1={minY} x2={svgWidth - paddingRight} y2={minY} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.75} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.75} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.5} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.5} />
                        <line x1={paddingLeft} y1={zeroY - graphHeight * 0.25} x2={svgWidth - paddingRight} y2={zeroY - graphHeight * 0.25} />
                        <line x1={paddingLeft} y1={zeroY} x2={svgWidth - paddingRight} y2={zeroY} stroke="#E2E8F0" strokeWidth="1.5" />
                    </g>

                    {/* Автоматические подписи значений шкал (TJS) */}
                    <g fontSize="11" fill="#94A3B8" textAnchor="end" fontFamily="inherit" fontWeight="500">
                        <text x={paddingLeft - 12} y={minY + 4}>{maxAmount.toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.75 + 4}>{quarterAmount.toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.5 + 4}>{midAmount.toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY - graphHeight * 0.25 + 4}>{lowAmount.toLocaleString()} TJS</text>
                        <text x={paddingLeft - 12} y={zeroY + 4}>0 TJS</text>
                    </g>

                    {/* Отрисовка волн на основе реальных данных */}
                    {maxAmount > 0 && (
                        <>
                            {/* Слои заливки цвета под графиками */}
                            <path d={incomeSpline.area} fill="url(#incomeGrad)" />
                            <path d={expenseSpline.area} fill="url(#expenseGrad)" />

                            {/* Основные линии тренда */}
                            <path d={incomeSpline.line} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                            <path d={expenseSpline.line} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />

                            {/* Маркерные точки для Доходов */}
                            {incomeSpline.points.map((pt, idx) => monthlyIncome[idx] > 0 && (
                                <circle key={`in-point-${idx}`} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                            ))}

                            {/* Маркерные точки для Расходов */}
                            {expenseSpline.points.map((pt, idx) => monthlyExpense[idx] > 0 && (
                                <circle key={`ex-point-${idx}`} cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#f43f5e" strokeWidth="2.5" />
                            ))}
                        </>
                    )}

                    {/* Временная шкала месяцев (Ось X) */}
                    <g fontSize="11" fill="#64748B" textAnchor="middle" fontWeight="500">
                        {monthsLabels.map((m, idx) => {
                            const x = paddingLeft + idx * (graphWidth / 11);
                            return <text key={m} x={x} y={zeroY + 22}>{m}</text>;
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
};

const styles = {
    wrapper: { 
        background: '#ffffff', 
        border: '1px solid #E2E8F0', 
        borderRadius: '16px', 
        padding: '24px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        marginBottom: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
        gap: '16px'
    },
    title: { fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 },
    subtitle: { fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' },
    controlsRow: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const },
    legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
    lineIndicator: { width: '12px', height: '4px', borderRadius: '2px' },
    legendText: { fontSize: '13px', fontWeight: 500, color: '#475569' },
    dropdown: {
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: 500,
        color: '#334155',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        outline: 'none',
        cursor: 'pointer'
    }
};