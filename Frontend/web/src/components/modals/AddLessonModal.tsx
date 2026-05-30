import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlignLeft, Hash } from 'lucide-react';
import { lessonService } from '../../api/lessonService';

interface AddLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    currentWeek: number;
    onLessonCreated: () => void;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({
    isOpen, onClose, groupId, currentWeek, onLessonCreated
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);

    // Используем чистый формат HH:mm для нативного инпута
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('20:00');
    const [orderIndex, setOrderIndex] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Закрытие окна по кнопке Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await lessonService.create({
                groupId,
                weekNumber: currentWeek,
                orderIndex,
                title: title.trim(),
                description: description.trim(),
                lessonDate: lessonDate + 'T00:00:00.000Z', // явно строка
                startTime: startTime + ':00',
                endTime: endTime + ':00'
            });

            onLessonCreated();
            setTitle('');
            setDescription('');
            onClose();
        } catch (err: any) {
            console.log('Full error:', err.response); // добавь это
            const backendError = err.response?.data?.error
                || err.response?.data?.message
                || err.response?.data?.title
                || 'Ошибка создания занятия';

            setError(backendError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}
            onMouseDown={onClose}
        >
            {/* Глобальные стили для красивых инпутов и анимации появления */}
            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .edm-modal {
                    animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .edm-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .edm-icon {
                    position: absolute;
                    left: 12px;
                    color: #94A3B8;
                    pointer-events: none;
                }
                .edm-field {
                    width: 100%;
                    padding: 10px 12px 10px 38px;
                    border-radius: 8px;
                    border: 1px solid #CBD5E1;
                    outline: none;
                    font-size: 13px;
                    color: #0F172A;
                    background: #FFFFFF;
                    transition: all 0.15s ease-in-out;
                }
                .edm-field:focus {
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
                }
                .edm-field::placeholder {
                    color: #94A3B8;
                }
                .edm-textarea {
                    min-height: 70px;
                    resize: vertical;
                }
                .edm-submit-btn {
                    background: #4F46E5;
                    color: #FFFFFF;
                    padding: 11px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: background 0.15s ease;
                }
                .edm-submit-btn:hover:not(:disabled) {
                    background: #4338CA;
                }
                .edm-submit-btn:disabled {
                    background: #94A3B8;
                    cursor: not-allowed;
                }
                .edm-close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #94A3B8;
                    padding: 4px;
                    border-radius: 6px;
                    transition: background 0.15s, color 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .edm-close-btn:hover {
                    background: #F1F5F9;
                    color: #0F172A;
                }
            `}</style>

            <div
                className="edm-modal"
                style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    width: '460px',
                    padding: '24px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Шапка модалки */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Добавить занятие</h3>
                        <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>Учебная неделя {currentWeek}</span>
                    </div>
                    <button onClick={onClose} className="edm-close-btn">
                        <X size={18} />
                    </button>
                </div>

                {/* Блок ошибки */}
                {error && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#EF4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <X size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>{error}</div>
                    </div>
                )}

                {/* Форма */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Название */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Название темы</label>
                        <div className="edm-input-wrapper">
                            <BookOpen size={15} className="edm-icon" />
                            <input
                                type="text"
                                className="edm-field"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Введение в React Hooks"
                            />
                        </div>
                    </div>

                    {/* Описание */}
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Описание (необязательно)</label>
                        <div className="edm-input-wrapper">
                            <AlignLeft size={15} className="edm-icon" style={{ top: '12px' }} />
                            <textarea
                                className="edm-field edm-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Разбор useState, useEffect..."
                            />
                        </div>
                    </div>

                    {/* Дата и Порядковый номер */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Дата занятия</label>
                            <div className="edm-input-wrapper">
                                <Calendar size={15} className="edm-icon" />
                                <input
                                    type="date"
                                    className="edm-field"
                                    required
                                    value={lessonDate}
                                    onChange={(e) => setLessonDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Порядковый № урока</label>
                            <div className="edm-input-wrapper">
                                <Hash size={15} className="edm-icon" />
                                <input
                                    type="number"
                                    className="edm-field"
                                    min={1}
                                    required
                                    value={orderIndex}
                                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Время начала и конца */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Начало</label>
                            <div className="edm-input-wrapper">
                                <Clock size={15} className="edm-icon" />
                                <input
                                    type="time"
                                    className="edm-field"
                                    required
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '5px' }}>Конец</label>
                            <div className="edm-input-wrapper">
                                <Clock size={15} className="edm-icon" />
                                <input
                                    type="time"
                                    className="edm-field"
                                    required
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Кнопка отправки */}
                    <button type="submit" className="edm-submit-btn" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? 'Создание...' : 'Создать занятие'}
                    </button>
                </form>
            </div>
        </div>
    );
};