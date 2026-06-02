import React, { useMemo } from 'react';
import {
    ResponsiveContainer, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { WeekResultResponse } from '../../../types/journal';

// Пропсы: теперь передаем сюда еще и список студентов, чтобы график не ломался
interface Props {
    weekResults: Record<number, WeekResultResponse[]>;
    weeks: number[];
    students: { id: number; fullName: string }[]; 
}

const LINE_COLORS = [
    '#F97316', '#10B981', '#3B82F6', '#A78BFA', '#64748B',
    '#06B6D4', '#EAB308', '#EC4899', '#84CC16', '#EF4444'
];

const shortName = (full: string) => {
    const parts = full.trim().split(/\s+/);
    if (parts.length > 1) {
        return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0] || '';
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                fontFamily: "sans-serif",
                fontSize: '13px',
                minWidth: '170px',
            }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#0F172A' }}>
                    {label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color
                                }} />
                                <span style={{ color: '#475569', fontWeight: 500 }}>
                                    {entry.name}
                                </span>
                            </div>
                            <span style={{ color: entry.color, fontWeight: 600 }}>
                                {entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const JournalChart: React.FC<Props> = ({ weekResults, weeks, students }) => {
    const { chartData, studentLines } = useMemo(() => {
        const sortedWeeks = [...weeks].sort((a, b) => a - b);

        // 1. Базируем линии СТРОГО на общем списке студентов группы. 
        // Теперь никто не исчезнет из легенды, если за неделю нет оценок!
        const lines = students.map(s => ({
            id: s.id.toString(),
            name: s.fullName,
            short: shortName(s.fullName),
        }));

        // 2. Строим точки для каждой недели
        const data = sortedWeeks.map(wn => {
            const point: Record<string, string | number> = { week: `week ${wn}` };
            
            // Задаем базовый 0 для каждого студента
            lines.forEach(l => {
                point[l.id] = 0;
            });

            // Накатываем реальные баллы из weekResults, защищая от undefined структур
            const currentWeekData = weekResults[wn] || [];
            currentWeekData.forEach(wr => {
                if (wr && wr.studentId) {
                    point[wr.studentId.toString()] = Number(wr.totalScore.toFixed(1));
                }
            });
            return point;
        });

        // 3. Расчёт 'average' (всегда делим строго на общее число недель)
        const avgPoint: Record<string, string | number> = { week: 'average' };
        lines.forEach(l => {
            const studentScores = sortedWeeks.map(wn => {
                const currentWeekData = weekResults[wn] || [];
                const found = currentWeekData.find(w => w && w.studentId === Number(l.id));
                return found ? found.totalScore : 0;
            });

            avgPoint[l.id] = studentScores.length
                ? Number((studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(1))
                : 0;
        });
        data.push(avgPoint);

        return { chartData: data, studentLines: lines };
    }, [weekResults, weeks, students]);

    if (studentLines.length === 0) return null;

    return (
        <div style={s.card}>
            <ResponsiveContainer width="100%" height={380}>
                <LineChart
                    data={chartData}
                    margin={{ top: 15, right: 20, left: -20, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={true} />
                    
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 13, fill: '#1E293B', fontWeight: 400 }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                        tickMargin={10}
                    />
                    <YAxis
                        domain={[0, 120]}
                        ticks={[0, 30, 60, 90, 120]}
                        tick={{ fontSize: 13, fill: '#1E293B', fontWeight: 400 }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                        tickMargin={10}
                    />
                    
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 13, paddingTop: 24, fill: '#475569' }}
                    />

                    {studentLines.map((sl, idx) => (
                        <Line
                            key={sl.id}
                            type="monotone"
                            dataKey={sl.id}
                            name={sl.short}
                            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: LINE_COLORS[idx % LINE_COLORS.length], strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={300} // Быстрая плавная анимация перестроения при изменении стейта
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const s = {
    card: {
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '16px',
        padding: '24px 24px 16px 24px',
        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.02)',
        fontFamily: "sans-serif",
    } as React.CSSProperties,
};

export default JournalChart;