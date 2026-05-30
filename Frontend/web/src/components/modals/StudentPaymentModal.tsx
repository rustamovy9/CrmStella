import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, LayoutGrid, Upload } from 'lucide-react';
import groupService from '../../api/groupService';

interface StudentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentName: string;
    onSubmit: (data: {
        amount: number;
        type: number;
        method: number;
        groupId: number;
        dueDate?: string;
        note?: string;
        receipt?: File;
    }) => Promise<void>;
}

// PaymentType enum — совпадает с backend
const PAYMENT_TYPES = [
    { value: 1, label: 'Оплата' },
    { value: 2, label: 'Долг' },
    { value: 3, label: 'Возврат' },
    { value: 4, label: 'Бонус' },
    { value: 5, label: 'Скидка' },
];

// PaymentMethod enum — совпадает с backend
const PAYMENT_METHODS = [
    { value: 1, label: 'Наличные' },
    { value: 2, label: 'Карта' },
    { value: 3, label: 'Перевод' },
    { value: 4, label: 'Онлайн' },
    { value: 5, label: 'Другое' },
];

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
    isOpen,
    onClose,
    studentName,
    onSubmit
}) => {
    const [amount, setAmount] = useState<string>('');
    const [type, setType] = useState<number>(1);
    const [method, setMethod] = useState<number>(1);
    const [groupId, setGroupId] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [receipt, setReceipt] = useState<File | undefined>(undefined);
    const [groups, setGroups] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            groupService.getAll({ page: 1, pageSize: 100 })
                .then(res => {
                    if (res.data?.isSuccess && res.data?.data?.items) {
                        setGroups(res.data.data.items);
                    }
                })
                .catch(err => console.error('Ошибка загрузки групп:', err));
        }
    }, [isOpen]);

    // сброс формы при закрытии
    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setType(1);
            setMethod(1);
            setGroupId('');
            setDueDate('');
            setNote('');
            setReceipt(undefined);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!amount || Number(amount) <= 0) {
            setError('Введите корректную сумму');
            return;
        }
        if (!groupId) {
            setError('Выберите группу');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit({
                amount: Number(amount),
                type: Number(type),
                method: Number(method),
                groupId: Number(groupId),
                dueDate: dueDate || undefined,
                note: note.trim() || undefined,
                receipt: receipt
            });
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.error
                || err?.response?.data?.message
                || 'Ошибка сохранения платежа';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={st.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <style>{`
                .spm-input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; outline: none; }
                .spm-cancel:hover { background: #F1F5F9 !important; }
                .spm-submit:hover:not(:disabled) { background: #1D4ED8 !important; }
                .spm-submit:disabled { background: #93C5FD !important; cursor: not-allowed; }
                .spm-file:hover { border-color: #2563EB !important; background: #EFF6FF !important; }
                .spm-close:hover { color: #0F172A !important; background: #F1F5F9 !important; border-radius: 8px; }
            `}</style>

            <div style={st.modal}>
                {/* Header */}
                <div style={st.header}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={st.iconCircle}>
                            <CreditCard size={20} color="#2563EB" />
                        </div>
                        <div>
                            <h3 style={st.title}>Принять платёж</h3>
                            <p style={st.subtitle}>
                                Студент: <span style={{ color: '#0F172A', fontWeight: 600 }}>{studentName}</span>
                            </p>
                        </div>
                    </div>
                    <button className="spm-close" style={st.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={st.errorBox}>
                        <X size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleFormSubmit} style={st.form}>

                    {/* Сумма */}
                    <div style={st.field}>
                        <label style={st.label}>Сумма (TJS) *</label>
                        <div style={st.inputWrap}>
                            <DollarSign size={15} style={st.icon} />
                            <input
                                type="number"
                                className="spm-input"
                                required
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={st.input}
                            />
                        </div>
                    </div>

                    <div style={st.row}>
                        {/* Тип операции */}
                        <div style={st.field}>
                            <label style={st.label}>Тип операции</label>
                            <select
                                className="spm-input"
                                value={type}
                                onChange={(e) => setType(Number(e.target.value))}
                                style={st.select}
                            >
                                {PAYMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Способ оплаты */}
                        <div style={st.field}>
                            <label style={st.label}>Способ оплаты</label>
                            <select
                                className="spm-input"
                                value={method}
                                onChange={(e) => setMethod(Number(e.target.value))}
                                style={st.select}
                            >
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={st.row}>
                        {/* Группа */}
                        <div style={st.field}>
                            <label style={st.label}>Группа *</label>
                            <div style={st.inputWrap}>
                                <LayoutGrid size={15} style={st.icon} />
                                <select
                                    className="spm-input"
                                    required
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value)}
                                    style={{ ...st.select, paddingLeft: '38px' }}
                                >
                                    <option value="">Выберите группу...</option>
                                    {groups.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Дата */}
                        <div style={st.field}>
                            <label style={st.label}>Дата платежа</label>
                            <div style={st.inputWrap}>
                                <Calendar size={15} style={st.icon} />
                                <input
                                    type="date"
                                    className="spm-input"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    style={st.input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Примечание */}
                    <div style={st.field}>
                        <label style={st.label}>Примечание</label>
                        <div style={st.inputWrap}>
                            <FileText size={15} style={{ ...st.icon, top: '12px' }} />
                            <textarea
                                className="spm-input"
                                rows={2}
                                placeholder="Дополнительная информация..."
                                value={note}
                                maxLength={500}
                                onChange={(e) => setNote(e.target.value)}
                                style={{
                                    ...st.input,
                                    resize: 'none',
                                    paddingTop: '11px',
                                    height: 'auto',
                                }}
                            />
                        </div>
                    </div>

                    {/* Квитанция */}
                    <div style={st.field}>
                        <label style={st.label}>Квитанция (необязательно)</label>
                        <label className="spm-file" style={st.fileUpload}>
                            <Upload size={15} color="#64748B" />
                            <span style={{
                                fontSize: '13px',
                                color: receipt ? '#0F172A' : '#94A3B8',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {receipt ? receipt.name : 'Загрузить файл (JPG, PNG, PDF)'}
                            </span>
                            {receipt && (
                                <span
                                    style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: '12px', cursor: 'pointer' }}
                                    onClick={(e) => { e.preventDefault(); setReceipt(undefined); }}
                                >
                                    Удалить
                                </span>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => setReceipt(e.target.files?.[0])}
                            />
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div style={st.actions}>
                        <button
                            type="button"
                            className="spm-cancel"
                            onClick={onClose}
                            style={st.cancelBtn}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="spm-submit"
                            disabled={submitting}
                            style={st.submitBtn}
                        >
                            {submitting ? 'Сохранение...' : 'Сохранить платёж'}
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
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    modal: {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '28px',
        width: '100%',
        maxWidth: '520px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxHeight: '90vh',
        overflowY: 'auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    iconCircle: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#EFF6FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    title: {
        margin: 0,
        fontSize: '17px',
        fontWeight: 700,
        color: '#0F172A',
    },
    subtitle: {
        margin: '2px 0 0',
        fontSize: '13px',
        color: '#64748B',
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#94A3B8',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        background: '#FEF2F2',
        border: '1px solid #FEE2E2',
        color: '#DC2626',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        marginBottom: '16px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
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
    },
    inputWrap: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    icon: {
        position: 'absolute',
        left: '12px',
        color: '#94A3B8',
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '11px 14px 11px 38px',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#0F172A',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s',
    },
    select: {
        width: '100%',
        padding: '11px 36px 11px 14px',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#0F172A',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
    },
    row: {
        display: 'flex',
        gap: '12px',
    },
    fileUpload: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '11px 14px',
        background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '4px',
    },
    cancelBtn: {
        height: '42px',
        padding: '0 20px',
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#475569',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
    },
    submitBtn: {
        height: '42px',
        padding: '0 24px',
        background: '#2563EB',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
    },
};

export default StudentPaymentModal;