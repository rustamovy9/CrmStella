import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, FileText, Upload, Wallet } from 'lucide-react';
import { financeService } from '../../api/paymentService';

interface StudentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: number;
    studentName: string;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { value: 1, label: 'Наличные' },
    { value: 2, label: 'Карта' },
    { value: 3, label: 'Перевод' },
    { value: 4, label: 'Онлайн' },
    { value: 5, label: 'Другое' },
];

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
    isOpen, onClose, studentId, studentName, onSuccess
}) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('1');
    const [note, setNote] = useState('');
    const [receipt, setReceipt] = useState<File | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setMethod('1');
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

        try {
            setSubmitting(true);

            const result = await financeService.topUp({
                studentId,
                amount: Number(amount),
                method: Number(method),
                note: note.trim() || undefined,
                receipt,
            });

            if (!result.isSuccess) {
                setError(result.error || 'Ошибка пополнения');
                return;
            }

            onClose();
            onSuccess();
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                'Ошибка сохранения платежа'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={st.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <style>{`
                @keyframes spm-slide { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .spm-card { animation: spm-slide 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
                .spm-input { width: 100%; padding: 12px 14px 12px 40px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 14px; color: #0F172A; box-sizing: border-box; outline: none; font-family: inherit; transition: all 0.2s ease; }
                .spm-input:focus { border-color: #10B981; background: #FFFFFF; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
                .spm-sel { width: 100%; padding: 12px 36px 12px 40px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; font-size: 14px; color: #0F172A; box-sizing: border-box; outline: none; font-family: inherit; appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; cursor: pointer; transition: all 0.2s ease; }
                .spm-sel:focus { border-color: #10B981; background-color: #FFFFFF; box-shadow: 0 0 0 4px rgba(16,185,129,0.1); }
                .spm-cancel:hover { background: #F1F5F9 !important; border-color: #CBD5E1 !important; }
                .spm-save { box-shadow: 0 4px 12px rgba(16,185,129,0.25); transition: all 0.2s ease !important; }
                .spm-save:hover:not(:disabled) { background: #059669 !important; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.35); }
                .spm-save:disabled { opacity: 0.6; cursor: not-allowed; }
                .spm-file:hover { border-color: #10B981 !important; background: #F0FDF4 !important; }
                .spm-close:hover { color: #0F172A !important; background: #F1F5F9 !important; }
            `}</style>

            <div className="spm-card" style={st.card} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={st.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={st.iconCircle}>
                            <Wallet size={20} color="#10B981" />
                        </div>
                        <div>
                            <h3 style={st.title}>Пополнение счёта</h3>
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
                        <X size={14} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleFormSubmit} style={st.form}>

                    {/* Сумма */}
                    <div style={st.field}>
                        <label style={st.label}>Сумма (TJS) *</label>
                        <div style={st.wrap}>
                            <DollarSign size={16} style={st.icon} />
                            <input
                                type="number"
                                className="spm-input"
                                required
                                min="1"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                autoFocus
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Способ оплаты */}
                    <div style={st.field}>
                        <label style={st.label}>Способ оплаты</label>
                        <div style={st.wrap}>
                            <CreditCard size={16} style={st.icon} />
                            <select
                                className="spm-sel"
                                value={method}
                                onChange={e => setMethod(e.target.value)}
                            >
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Примечание */}
                    <div style={st.field}>
                        <label style={st.label}>Примечание</label>
                        <div style={st.wrap}>
                            <FileText size={16} style={st.icon} />
                            <input
                                type="text"
                                className="spm-input"
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
                        <label className="spm-file" style={st.fileUpload}>
                            <Upload size={16} color="#64748B" />
                            <span style={{
                                fontSize: '13px',
                                color: receipt ? '#0F172A' : '#94A3B8',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                fontWeight: receipt ? 500 : 400,
                            }}>
                                {receipt ? receipt.name : 'Выберите файл (JPG, PNG, PDF)'}
                            </span>
                            {receipt && (
                                <span
                                    style={{ fontSize: '12px', color: '#EF4444', cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}
                                    onClick={e => { e.preventDefault(); setReceipt(undefined); }}
                                >
                                    Удалить
                                </span>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                onChange={e => setReceipt(e.target.files?.[0])}
                            />
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div style={st.footer}>
                        <button
                            type="button"
                            className="spm-cancel"
                            onClick={onClose}
                            style={st.cancelBtn}
                            disabled={submitting}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="spm-save"
                            style={st.saveBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Сохранение...' : 'Пополнить счёт'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const st: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.3)',
        backdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1100,
    },
    card: {
        background: '#fff', padding: '32px', borderRadius: '24px',
        width: '460px', maxHeight: '90vh', overflowY: 'auto',
        boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(15,23,42,0.15)',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px',
    },
    iconCircle: {
        width: '48px', height: '48px', borderRadius: '14px',
        background: '#ECFDF5', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    title: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' },
    subtitle: { margin: '3px 0 0', fontSize: '13px', color: '#64748B' },
    closeBtn: {
        background: 'transparent', border: 'none', color: '#94A3B8',
        cursor: 'pointer', padding: '6px', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', borderRadius: '8px',
    },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '10px',
        background: '#FEF2F2', border: '1px solid #FEE2E2',
        color: '#DC2626', padding: '12px 16px', borderRadius: '12px',
        fontSize: '13px', marginBottom: '16px', fontWeight: 500,
    },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 },
    label: { fontSize: '12px', fontWeight: 600, color: '#475569', paddingLeft: '2px' },
    wrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    icon: { position: 'absolute', left: '14px', color: '#94A3B8', pointerEvents: 'none', zIndex: 10 },
    fileUpload: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px', background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1', borderRadius: '12px',
        cursor: 'pointer', transition: 'all 0.15s',
    },
    footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
    cancelBtn: {
        height: '44px', padding: '0 20px', background: '#fff',
        border: '1px solid #E2E8F0', borderRadius: '12px',
        fontSize: '14px', fontWeight: 600, color: '#475569',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    },
    saveBtn: {
        height: '44px', padding: '0 24px', background: '#10B981',
        border: 'none', borderRadius: '12px', fontSize: '14px',
        fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
};

export default StudentPaymentModal;