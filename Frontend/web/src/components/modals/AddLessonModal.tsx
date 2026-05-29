import React, { useState } from 'react';
import { X } from 'lucide-react';
import { lessonService } from '../../api/lessonService';

interface AddLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: number;
    currentWeek: number;
    onLessonCreated: () => void;
}

export const AddLessonModal: React.FC<AddLessonModalProps> = ({ isOpen, onClose, groupId, currentWeek, onLessonCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('18:00:00');
    const [endTime, setEndTime] = useState('20:00:00');
    const [orderIndex, setOrderIndex] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                title,
                description,
                lessonDate: new Date(lessonDate).toISOString(),
                startTime,
                endTime
            });
            onLessonCreated();
            setTitle('');
            setDescription('');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Неудачная попытка создать занятие');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Добавить занятие (Неделя {currentWeek})</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
                </div>

                {error && <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Название темы</label>
                        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введение в React Hooks" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }} />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Описание (необязательно)</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Разбор useState, useEffect..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', minHeight: '60px', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Дата занятия</label>
                            <input type="date" required value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Порядковый № урока</label>
                            <input type="number" min={1} required value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Начало</label>
                            <input type="text" required value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="18:00:00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Конец</label>
                            <input type="text" required value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="20:00:00" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }} />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{ background: '#4F46E5', color: '#fff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {loading ? 'Создание...' : 'Создать занятие'}
                    </button>
                </form>
            </div>
        </div>
    );
};