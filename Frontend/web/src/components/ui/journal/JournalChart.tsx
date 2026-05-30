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
            <ResponsiveContainer width="100%" height={340}>
                <LineChart
                    data={chartData}
                    margin={{ top: 16, right: 24, left: -10, bottom: 16 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 120]}
                        ticks={[0, 30, 60, 90, 120]}
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 10,
                            border: '1px solid #E2E8F0',
                            fontSize: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                    {studentLines.map((sl, idx) => (
                        <Line
                            key={sl.id}
                            type="monotone"
                            dataKey={sl.short}
                            stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
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
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    } as React.CSSProperties,
};

export default JournalChart;