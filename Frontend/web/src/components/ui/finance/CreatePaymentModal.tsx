import React, { useState } from 'react';
import { X, DollarSign, Users, LayoutGrid, CreditCard, FileText, Upload } from 'lucide-react';

interface DropdownOption {
    id: number;
    name: string;
}

interface CreatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: {
        studentId: number;
        groupId: number;
        amount: number;
        type: number;
        method: number;
        note: string;
        receipt: File | null;
    }) => void;
    students: DropdownOption[];
    groups: DropdownOption[];
}

const PAYMENT_TYPES = [
    { value: 1, label: 'Оплата' },
    { value: 2, label: 'Долг' },
    { value: 3, label: 'Возврат' },
    { value: 4, label: 'Бонус' },
    { value: 5, label: 'Скидка' },
];

const PAYMENT_METHODS = [
    { value: 1, label: 'Наличные' },
    { value: 2, label: 'Карта' },
    { value: 3, label: 'Перевод' },
    { value: 4, label: 'Онлайн' },
    { value: 5, label: 'Другое' },
];

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
    isOpen, onClose, onSubmit, students, groups
}) => {
    const [studentId, setStudentId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [amount, setAmount] = useState('');
    const [pMethod, setPMethod] = useState('1');
    const [pType, setPType] = useState('1');
    const [note, setNote] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setStudentId(''); setGroupId(''); setAmount('');
        setNote(''); setReceipt(null); setError(null);
        setPMethod('1'); setPType('1');
        onClose();
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!studentId) { setError('Выберите студента'); return; }
        if (!groupId)   { setError('Выберите группу'); return; }
        if (!amount || Number(amount) <= 0) { setError('Введите корректную сумму'); return; }

        onSubmit({
            studentId: Number(studentId),
            groupId: Number(groupId),
            amount: Number(amount),
            type: Number(pType),
            method: Number(pMethod),
            note: note.trim(),
            receipt
        });

        handleClose();
    };

    return (
        <div style={st.overlay} onClick={handleClose}>
            <style>{`
                @keyframes cpm-slide {
                    from { transform: translateY(12px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                .cpm-card { 
                    animation: cpm-slide 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                }
                .cpm-input { 
                    width: 100%; 
                    padding: 12px 14px 12px 40px; 
                    background: #F8FAFC; 
                    border: 1px solid #E2E8F0; 
                    border-radius: 12px; 
                    font-size: 14px; 
                    color: #0F172A; 
                    box-sizing: border-box; 
                    outline: none; 
                    font-family: inherit; 
                    transition: all 0.2s ease; 
                }
                .cpm-input:focus { 
                    border-color: #4F46E5; 
                    background: #FFFFFF;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); 
                }
                .cpm-sel { 
                    width: 100%; 
                    padding: 12px 36px 12px 40px; 
                    background: #F8FAFC; 
                    border: 1px solid #E2E8F0; 
                    border-radius: 12px; 
                    font-size: 14px; 
                    color: #0F172A; 
                    box-sizing: border-box; 
                    outline: none; 
                    font-family: inherit; 
                    appearance: none; 
                    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); 
                    background-repeat: no-repeat; 
                    background-position: right 14px center; 
                    cursor: pointer; 
                    transition: all 0.2s ease; 
                }
                .cpm-sel:focus { 
                    border-color: #4F46E5; 
                    background-color: #FFFFFF;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); 
                }
                .cpm-cancel:hover { 
                    background: #F1F5F9 !important; 
                    border-color: #CBD5E1 !important;
                }
                .cpm-save {
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
                    transition: all 0.2s ease !important;
                }
                .cpm-save:hover:not(:disabled) { 
                    background: #4338CA !important; 
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
                }
                .cpm-save:active {
                    transform: translateY(0);
                }
                .cpm-file:hover { 
                    border-color: #4F46E5 !important; 
                    background: #F5F3FF !important; 
                }
                .cpm-close:hover { 
                    color: #0F172A !important; 
                    background: #F1F5F9 !important; 
                }
            `}</style>

            <div className="cpm-card" style={st.card} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={st.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={st.iconCircle}>
                            <CreditCard size={20} color="#4F46E5" />
                        </div>
                        <h3 style={st.title}>Новый платёж</h3>
                    </div>
                    <button className="cpm-close" style={st.closeBtn} onClick={handleClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={st.errorBox}>
                        <X size={14} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleFormSubmit} style={st.form}>

                    {/* Студент */}
                    <div style={st.field}>
                        <label style={st.label}>Студент *</label>
                        <div style={st.wrap}>
                            <Users size={16} style={st.icon} />
                            <select
                                className="cpm-sel"
                                required
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                            >
                                <option value="">Выберите студента из списка CRM</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Группа */}
                    <div style={st.field}>
                        <label style={st.label}>Группа / Курс *</label>
                        <div style={st.wrap}>
                            <LayoutGrid size={16} style={st.icon} />
                            <select
                                className="cpm-sel"
                                required
                                value={groupId}
                                onChange={e => setGroupId(e.target.value)}
                            >
                                <option value="">Выберите учебную группу</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Сумма */}
                    <div style={st.field}>
                        <label style={st.label}>Сумма (TJS) *</label>
                        <div style={st.wrap}>
                            <DollarSign size={16} style={st.icon} />
                            <input
                                type="number"
                                className="cpm-input"
                                required
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Тип и Метод */}
                    <div style={st.row}>
                        <div style={st.field}>
                            <label style={st.label}>Способ оплаты</label>
                            <div style={st.wrap}>
                                <CreditCard size={16} style={st.icon} />
                                <select
                                    className="cpm-sel"
                                    value={pMethod}
                                    onChange={e => setPMethod(e.target.value)}
                                >
                                    {PAYMENT_METHODS.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div style={st.field}>
                            <label style={st.label}>Тип операции</label>
                            <div style={st.wrap}>
                                <FileText size={16} style={st.icon} />
                                <select
                                    className="cpm-sel"
                                    value={pType}
                                    onChange={e => setPType(e.target.value)}
                                >
                                    {PAYMENT_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Примечание */}
                    <div style={st.field}>
                        <label style={st.label}>Примечание</label>
                        <div style={st.wrap}>
                            <FileText size={16} style={st.icon} />
                            <input
                                type="text"
                                className="cpm-input"
                                placeholder="Дополнительная информация..."
                                value={note}
                                maxLength={500}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Квитанция */}
                    <div style={st.field}>
                        <label style={st.label}>Документ / Квитанция</label>
                        <label className="cpm-file" style={st.fileUpload}>
                            <Upload size={16} color="#64748B" />
                            <span style={{
                                fontSize: '13px',
                                color: receipt ? '#0F172A' : '#94A3B8',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                fontWeight: receipt ? 500 : 400
                            }}>
                                {receipt ? receipt.name : 'Выберите файл (JPG, PNG, PDF)'}
                            </span>
                            {receipt && (
                                <span
                                    style={{ fontSize: '12px', color: '#EF4444', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}
                                    onClick={e => { e.preventDefault(); setReceipt(null); }}
                                >
                                    Удалить
                                </span>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => setReceipt(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div style={st.footer}>
                        <button
                            type="button"
                            className="cpm-cancel"
                            onClick={handleClose}
                            style={st.cancelBtn}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="cpm-save"
                            style={st.saveBtn}
                        >
                            Сохранить транзакцию
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const st: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100,
    },
    card: {
        background: '#fff',
        padding: '32px',
        borderRadius: '24px',
        width: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    iconCircle: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#EEF2FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 700,
        color: '#0F172A',
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#94A3B8',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all .15s ease',
        borderRadius: '8px',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#FEF2F2',
        border: '1px solid #FEE2E2',
        color: '#DC2626',
        padding: '12px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        marginBottom: '16px',
        fontWeight: 500,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
    },
    label: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#475569',
        paddingLeft: '2px',
    },
    wrap: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    icon: {
        position: 'absolute',
        left: '14px',
        color: '#94A3B8',
        pointerEvents: 'none',
        zIndex: 10,
    },
    row: {
        display: 'flex',
        gap: '14px',
    },
    fileUpload: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all .15s ease',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '8px',
    },
    cancelBtn: {
        height: '44px',
        padding: '0 20px',
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#475569',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all .15s ease',
    },
    saveBtn: {
        height: '44px',
        padding: '0 24px',
        background: '#4F46E5',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
};