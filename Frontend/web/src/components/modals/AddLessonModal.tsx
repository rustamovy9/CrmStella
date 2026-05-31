import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { LessonResponse } from '../../types/journal';
import { lessonService } from '../../api/lessonService';


interface AddLessonModalProps {
    isOpen: boolean;
    groupId: number;
    currentWeek: number;
    lessons: LessonResponse[]; // Передаем уроки для умного подсчета порядка
    onClose: () => void;
    onLessonCreated: () => void;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
    isOpen,
    groupId,
    currentWeek,
    lessons,
    onClose,
    onLessonCreated,
}) => {
    const [weekNumber, setWeekNumber] = useState<number>(currentWeek);
    const [orderIndex, setOrderIndex] = useState<number>(1);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:30');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🔥 Умный автоматический подсчет orderIndex при изменении выбранной недели
    useEffect(() => {
        const weekLessons = lessons.filter((l) => l.weekNumber === Number(weekNumber));
        if (weekLessons.length > 0) {
            const maxOrder = Math.max(...weekLessons.map((l) => l.orderIndex));
            setOrderIndex(maxOrder + 1);
        } else {
            setOrderIndex(1); // Если на этой неделе уроков еще нет
        }
    }, [weekNumber, lessons]);

    // Синхронизируем weekNumber, если текущая неделя в журнале изменилась
    useEffect(() => {
        setWeekNumber(currentWeek);
    }, [currentWeek]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Введите название урока');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await lessonService.create({
                groupId,
                weekNumber: Number(weekNumber),
                orderIndex: Number(orderIndex),
                title,
                description,
                // Приводим к формату бэкенда "YYYY-MM-DDT00:00:00" и "HH:MM:SS"
                lessonDate: `${lessonDate}T12:00:00.000Z`,
                startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
                endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
            });

            // Очищаем форму и триггерим обновление
            setTitle('');
            setDescription('');
            onLessonCreated();
        } catch (err: any) {
            console.error('Create lesson error:', err);
            setError(err?.response?.data?.message || 'Не удалось создать урок');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.overlay}>
            <div style={s.modal}>
                <div style={s.modalHeader}>
                    <span style={s.modalTitle}>Добавить новый урок</span>
                    <button style={s.modalClose} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {error && <div style={s.errorBlock}>{error}</div>}

                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.row}>
                        <div style={s.inputGroup}>
                            <label style={s.label}>Номер недели</label>
                            <input
                                type="number"
                                min={1}
                                style={s.input}
                                value={weekNumber}
                                onChange={(e) => setWeekNumber(Math.max(1, Number(e.target.value)))}
                            />
                        </div>
                        <div style={s.inputGroup}>
                            <label style={s.label}>Порядковый номер (урок №)</label>
                            <input
                                type="number"
                                min={1}
                                style={s.input}
                                value={orderIndex}
                                onChange={(e) => setOrderIndex(Math.max(1, Number(e.target.value)))}
                            />
                        </div>
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>Название урока</label>
                        <input
                            type="text"
                            placeholder="Введение в React..."
                            style={s.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>Описание (необязательно)</label>
                        <textarea
                            placeholder="Что будет на уроке..."
                            style={{ ...s.input, resize: 'vertical' }}
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>Дата урока</label>
                        <input
                            type="date"
                            style={s.input}
                            value={lessonDate}
                            onChange={(e) => setLessonDate(e.target.value)}
                        />
                    </div>

                    <div style={s.row}>
                        <div style={s.inputGroup}>
                            <label style={s.label}>Начало</label>
                            <input
                                type="time"
                                style={s.input}
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div style={s.inputGroup}>
                            <label style={s.label}>Конец</label>
                            <input
                                type="time"
                                style={s.input}
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={s.modalFooter}>
                        <button type="button" style={s.cancelBtn} onClick={onClose} disabled={loading}>
                            Отмена
                        </button>
                        <button type="submit" style={s.saveBtn} disabled={loading}>
                            {loading ? 'Создание...' : 'Создать урок'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const s = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '460px',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(15,23,42,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },
    modalTitle: {
        fontSize: '18px',
        fontWeight: 700,
        color: '#0F172A',
    },
    modalClose: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#94A3B8',
        padding: '4px',
        borderRadius: '6px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '14px',
    },
    row: {
        display: 'flex',
        gap: '12px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
        flex: 1,
    },
    label: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748B',
    },
    input: {
        padding: '10px 12px',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#0F172A',
        outline: 'none',
        boxSizing: 'border-box' as const,
        width: '100%',
    },
    errorBlock: {
        background: '#FEF2F2',
        color: '#EF4444',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        marginBottom: '14px',
        border: '1px solid #FEE2E2',
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '10px',
    },
    cancelBtn: {
        padding: '10px 18px',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        background: '#FFFFFF',
        color: '#64748B',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '10px 18px',
        border: 'none',
        borderRadius: '10px',
        background: '#4F46E5',
        color: '#FFFFFF',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    },
};