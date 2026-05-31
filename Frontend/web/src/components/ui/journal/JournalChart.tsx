import React, { useMemo } from 'react';
import {
    ResponsiveContainer, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import type { WeekResultResponse } from '../../../types/journal';

interface Props {
    weekResults: Record<number, WeekResultResponse[]>;
    weeks: number[];
}

const LINE_COLORS = [
    '#F97316', '#10B981', '#3B82F6', '#A78BFA', '#64748B',
    '#14B8A6', '#EF4444', '#6B7280', '#EAB308', '#EC4899',
    '#06B6D4', '#84CC16',
];

const shortName = (full: string) =>
    full.split(' ').map((p, i) => i === 0 ? `${p} ${(full.split(' ')[1] ?? '')[0] ?? ''}.` : '').join('');

// Кастомный тултип в стиле EduCRM
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                fontFamily: "'Inter', 'Montserrat', sans-serif",
                fontSize: '13px',
                minWidth: '160px',
            }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                    {label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color
                                }} />
                                <span style={{ color: entry.color, fontWeight: 500 }}>
                                    {entry.name}
                                </span>
                            </div>
                            <span style={{ color: entry.color, fontWeight: 600, marginLeft: '12px' }}>
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

const JournalChart: React.FC<Props> = ({ weekResults, weeks }) => {
    const { chartData, studentLines } = useMemo(() => {
        const sortedWeeks = [...weeks].sort((a, b) => a - b);

        // Собираем уникальных студентов
        const studentMap = new Map<number, string>();
        Object.values(weekResults).flat().forEach(wr => {
            studentMap.set(wr.studentId, wr.studentName);
        });

        const lines = Array.from(studentMap.entries()).map(([id, name]) => ({
            id,
            name,
            short: shortName(name),
        }));

        // Точки графика
        const data = sortedWeeks.map(wn => {
            const point: Record<string, string | number> = { week: `week ${wn}` };
            (weekResults[wn] ?? []).forEach(wr => {
                point[shortName(wr.studentName)] = Number(wr.totalScore.toFixed(1));
            });
            return point;
        });

        // Добавляем average — средний по всем студентам
        const avgPoint: Record<string, string | number> = { week: 'average' };
        lines.forEach(l => {
            const studentScores = sortedWeeks
                .map(wn => (weekResults[wn] ?? []).find(w => w.studentId === l.id)?.totalScore)
                .filter((v): v is number => typeof v === 'number');
            avgPoint[l.short] = studentScores.length
                ? Number((studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(1))
                : 0;
        });
        data.push(avgPoint);

        return { chartData: data, studentLines: lines };
    }, [weekResults, weeks]);

    if (chartData.length === 0 || studentLines.length === 0) return null;

    return (
        <div style={s.card}>
            <ResponsiveContainer width="100%" height={360}>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
                    style={{ fontFamily: "'Inter', 'Montserrat', sans-serif" }}
                >
                    <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={true} />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={12}
                    />
                    <YAxis
                        domain={[0, 120]}
                        ticks={[0, 30, 60, 90, 120]}
                        tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={12}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 13, paddingTop: 20, color: '#475569', fontWeight: 500 }}
                    />
                    {studentLines.map((sl, idx) => (
                        <Line
                            key={sl.id}
                            type="monotone"
                            dataKey={sl.short}
                            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                            strokeWidth={3}
                            // Делаем красивые "полые" точки как на скриншоте
                            dot={{ r: 4.5, fill: '#FFFFFF', strokeWidth: 2.5, stroke: LINE_COLORS[idx % LINE_COLORS.length] }}
                            activeDot={{ r: 7, strokeWidth: 0, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                            animationDuration={1200}
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
        border: '1px solid #F1F5F9', // Более мягкий цвет бордера
        borderRadius: '24px', // Закругления как в CRM
        padding: '28px 24px 16px 16px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)', // Мягкая современная тень
        fontFamily: "'Inter', 'Montserrat', sans-serif",
    } as React.CSSProperties,
};

export default JournalChart;