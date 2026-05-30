import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Clock, Users, Edit3, Trash2 } from 'lucide-react';
import type { ScheduleResponse } from '../../../types/schedule';

interface ScheduleTableProps {
    visibleDays: { key: string; label: string; short: string }[];
    byDay: Record<string, ScheduleResponse[]>;
    maxRows: number;
    todayKey: string;
    getGroupColor: (groupId: number) => { bg: string; text: string; dot: string };
    formatTime: (t: string) => string;
    formatDate: (d: string | null) => string | null;
    onNavigate: (groupId: number) => void;
    onEdit: (slot: ScheduleResponse) => void;
    onDelete: (id: number, name: string) => void;
    styles: Record<string, React.CSSProperties>;
}

/* ─── Хук: анимация только при смене фильтра, НЕ при новых данных ─── */
const useFilterAnimation = (filterKey: string) => {
    const [animating, setAnimating] = useState(false);
    const prevKey = useRef<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Первый рендер — ничего не делаем
        if (prevKey.current === null) {
            prevKey.current = filterKey;
            return;
        }
        // Фильтр не изменился — ничего не делаем
        if (prevKey.current === filterKey) return;

        prevKey.current = filterKey;

        // Запускаем анимацию
        setAnimating(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setAnimating(false), 350);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [filterKey]);

    return animating;
};

/* ─── Карточка занятия ─── */
interface SlotCardProps {
    slot: ScheduleResponse;
    color: { bg: string; text: string; dot: string };
    index: number;
    isListMode: boolean;
    animating: boolean;
    formatTime: (t: string) => string;
    formatDate: (d: string | null) => string | null;
    onNavigate: (id: number) => void;
    onEdit: (slot: ScheduleResponse) => void;
    onDelete: (id: number, name: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({
    slot, color, index, isListMode, animating,
    formatTime, formatDate, onNavigate, onEdit, onDelete,
}) => {
    const delay = animating ? index * 45 : 0;

    const chipStyle: React.CSSProperties = {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', borderRadius: '6px',
        background: 'rgba(255,255,255,0.65)',
        fontSize: '11px', color: '#475569', whiteSpace: 'nowrap',
    };

    const btnBase: React.CSSProperties = {
        border: 'none', borderRadius: '8px', width: '30px', height: '30px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', background: 'rgba(255,255,255,0.7)', flexShrink: 0,
    };

    const animStyle: React.CSSProperties = animating ? {
        opacity: 0,
        transform: 'translateY(10px) scale(0.97)',
        animation: `schedSlideIn 280ms ease forwards`,
        animationDelay: `${delay}ms`,
    } : {};

    if (isListMode) {
        return (
            <div className="slot-card-hover" style={{
                background: color.bg,
                borderLeft: `4px solid ${color.dot}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                ...animStyle,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color.dot }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: color.text, whiteSpace: 'nowrap' }}>
                        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: color.text, flex: 1, minWidth: '120px' }}>
                    {slot.groupName || `Группа #${slot.groupId}`}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {slot.room && <span style={chipStyle}><MapPin size={10} /> {slot.room}</span>}
                    {(slot.recurringFrom || slot.recurringTo) && (
                        <span style={chipStyle}>
                            <Clock size={10} />
                            {formatDate(slot.recurringFrom)}
                            {slot.recurringTo ? ` — ${formatDate(slot.recurringTo)}` : ''}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={btnBase} onClick={() => onNavigate(slot.groupId)} title="Перейти"><Users size={13} color="#64748B" /></button>
                    <button style={btnBase} onClick={() => onEdit(slot)} title="Редактировать"><Edit3 size={13} color="#64748B" /></button>
                    <button style={{ ...btnBase, background: '#FEE2E2' }} onClick={() => onDelete(slot.id, slot.groupName || '')} title="Удалить"><Trash2 size={13} color="#EF4444" /></button>
                </div>
            </div>
        );
    }

    return (
        <div className="slot-card-hover" style={{
            background: color.bg,
            borderLeft: `4px solid ${color.dot}`,
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: '7px',
            height: '100%', boxSizing: 'border-box',
            ...animStyle,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color.dot, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: color.text }}>
                    {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: color.text, lineHeight: 1.3 }}>
                {slot.groupName || `Группа #${slot.groupId}`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {slot.room && <span style={chipStyle}><MapPin size={9} /> {slot.room}</span>}
                {(slot.recurringFrom || slot.recurringTo) && (
                    <span style={chipStyle}>
                        <Clock size={9} />
                        {formatDate(slot.recurringFrom)}
                        {slot.recurringTo ? ` — ${formatDate(slot.recurringTo)}` : ''}
                    </span>
                )}
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                <button style={{ ...btnBase, width: 26, height: 26 }} onClick={() => onNavigate(slot.groupId)}><Users size={11} color="#64748B" /></button>
                <button style={{ ...btnBase, width: 26, height: 26 }} onClick={() => onEdit(slot)}><Edit3 size={11} color="#64748B" /></button>
                <button style={{ ...btnBase, width: 26, height: 26, background: '#FEE2E2' }} onClick={() => onDelete(slot.id, slot.groupName || '')}><Trash2 size={11} color="#EF4444" /></button>
            </div>
        </div>
    );
};

/* ─── Главный компонент ─── */
const ScheduleTable: React.FC<ScheduleTableProps> = ({
    visibleDays, byDay, maxRows, todayKey,
    getGroupColor, formatTime, formatDate,
    onNavigate, onEdit, onDelete,
}) => {
    // filterKey меняется только когда юзер меняет фильтр дней
    const filterKey = visibleDays.map(d => d.key).join(',');
    const animating = useFilterAnimation(filterKey);

    const isListMode = visibleDays.length === 1;

    return (
        <>
            {/* Keyframes для анимации — один раз в DOM */}
            <style>{`
                @keyframes schedSlideIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
            `}</style>

            {isListMode ? (
                /* ── LIST MODE ── */
                <div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '16px', paddingBottom: '12px',
                        borderBottom: '1px solid #E2E8F0',
                    }}>
                        <span style={{
                            fontSize: '15px', fontWeight: 600,
                            color: visibleDays[0].key === todayKey ? '#4F46E5' : '#0F172A',
                        }}>
                            {visibleDays[0].label}
                        </span>
                        <span style={{
                            fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                            background: visibleDays[0].key === todayKey ? '#EEF2FF' : '#F1F5F9',
                            color: visibleDays[0].key === todayKey ? '#4F46E5' : '#64748B',
                        }}>
                            {byDay[visibleDays[0].key].length}
                        </span>
                    </div>

                    {byDay[visibleDays[0].key].length === 0 ? (
                        <div style={{
                            padding: '50px 0', textAlign: 'center',
                            color: '#94A3B8', fontSize: '14px',
                        }}>
                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📅</div>
                            Нет занятий в этот день
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {byDay[visibleDays[0].key].map((slot, i) => (
                                <SlotCard key={slot.id} slot={slot}
                                    color={getGroupColor(slot.groupId)}
                                    index={i} animating={animating} isListMode={true}
                                    formatTime={formatTime} formatDate={formatDate}
                                    onNavigate={onNavigate} onEdit={onEdit} onDelete={onDelete} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── GRID MODE ── */
                <div style={{ overflowX: 'auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${visibleDays.length}, minmax(140px, 1fr))`,
                        minWidth: `${visibleDays.length * 140}px`,
                    }}>
                        {/* Заголовки */}
                        {visibleDays.map(d => {
                            const count = byDay[d.key]?.length ?? 0;
                            const isToday = d.key === todayKey;
                            return (
                                <div key={`hdr-${d.key}`} style={{
                                    padding: '10px 14px',
                                    background: isToday
                                        ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                                        : '#fff',
                                    color: isToday ? '#fff' : '#0F172A',
                                    border: isToday ? 'none' : '1px solid #E5E7EB',
                                    borderBottom: '2px solid #E2E8F0',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    fontWeight: 600, fontSize: '14px',
                                }}>
                                    {d.label}
                                    {count > 0 && (
                                        <span style={{
                                            fontSize: '11px', fontWeight: 600,
                                            padding: '2px 7px', borderRadius: '20px',
                                            background: isToday ? 'rgba(255,255,255,0.25)' : '#EEF2FF',
                                            color: isToday ? '#fff' : '#4F46E5',
                                        }}>{count}</span>
                                    )}
                                </div>
                            );
                        })}

                        {/* Ячейки */}
                        {Array.from({ length: maxRows }, (_, rowIdx) =>
                            visibleDays.map((d, colIdx) => {
                                const slot = (byDay[d.key] ?? [])[rowIdx];
                                return (
                                    <div key={`${rowIdx}-${d.key}`} style={{
                                        padding: '6px',
                                        borderRight: '1px solid #F1F5F9',
                                        borderBottom: '1px solid #F1F5F9',
                                        minHeight: '90px',
                                    }}>
                                        {slot ? (
                                            <SlotCard
                                                slot={slot}
                                                color={getGroupColor(slot.groupId)}
                                                index={rowIdx * visibleDays.length + colIdx}
                                                animating={animating}
                                                isListMode={false}
                                                formatTime={formatTime}
                                                formatDate={formatDate}
                                                onNavigate={onNavigate}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                            />
                                        ) : (
                                            <div style={{
                                                height: '100%', minHeight: '78px',
                                                borderRadius: '8px',
                                                border: '1.5px dashed #E2E8F0',
                                                opacity: 0.5,
                                            }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ScheduleTable;