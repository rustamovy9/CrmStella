// pages/Finance/components/FinanceTable.tsx
import React, { useState } from 'react';
import {
    Check, Trash2, AlertTriangle, X,
    FileText, Eye, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceTableProps {
    payments: PaymentListItem[];
    loading: boolean;
    onConfirm: (id: number) => void;
    onDelete: (id: number) => void;
}

interface TypeConfig {
    label: string;
    bg: string;
    color: string;
    sign: '+' | '−' | '';
    amountColor: string;
}

const TYPE_MAP: Record<string, TypeConfig> = {
    payment:   { label: 'Оплата',          bg: '#E2F5EA', color: '#10B981', sign: '+', amountColor: '#10B981' },
    income:    { label: 'Пополнение',       bg: '#E2F5EA', color: '#10B981', sign: '+', amountColor: '#10B981' },
    coursefee: { label: 'Оплата за курс',   bg: '#EFF6FF', color: '#1D4ED8', sign: '−', amountColor: '#1D4ED8' },
    debt:      { label: 'Долг',             bg: '#FEF3C7', color: '#B45309', sign: '−', amountColor: '#B45309' },
    refund:    { label: 'Возврат',          bg: '#FCEBEB', color: '#EF4444', sign: '−', amountColor: '#EF4444' },
    expense:   { label: 'Возврат',          bg: '#FCEBEB', color: '#EF4444', sign: '−', amountColor: '#EF4444' },
    bonus:     { label: 'Бонус',            bg: '#F3E8FF', color: '#8B5CF6', sign: '+', amountColor: '#8B5CF6' },
    discount:  { label: 'Скидка',           bg: '#E0F2FE', color: '#0284C7', sign: '−', amountColor: '#0284C7' },
};

const DEFAULT_TYPE: TypeConfig = {
    label: 'Прочее', bg: '#F1F5F9', color: '#475569', sign: '', amountColor: '#475569'
};

const getTypeKey = (p: any): string => String(p.type ?? '').toLowerCase();

const getTypeConfig = (p: any): TypeConfig => {
    const key = getTypeKey(p);
    if (!key) return TYPE_MAP.payment;
    return TYPE_MAP[key] || DEFAULT_TYPE;
};

// списание за курс = оплата за обучение проведена
const isCourseFee = (p: any): boolean => getTypeKey(p) === 'coursefee';

const checkIsConfirmed = (p: any) => {
    if (p.isConfirmed === true || p.isConfirmed === 'true') return true;
    if (p.status) {
        const s = String(p.status).toLowerCase();
        return s === 'проведен' || s === 'completed' || s === 'success' || s === '1' || s === 'approved';
    }
    return false;
};

const fmtDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
};

const getReceiptUrl = (p: any): string | null => {
    return p.receiptUrl || p.receipt || p.receiptPath || null;
};

const isImageReceipt = (url: string): boolean => {
    const lower = url.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/.test(lower);
};

export const FinanceTable: React.FC<FinanceTableProps> = ({
    payments, loading, onConfirm, onDelete
}) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const handleDeleteClick = (id: number) => {
        setSelectedPaymentId(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedPaymentId !== null) {
            onDelete(selectedPaymentId);
            setIsDeleteModalOpen(false);
            setSelectedPaymentId(null);
        }
    };

    return (
        <div style={styles.wrapper}>
            <style>{`
                .fin-row { transition: background-color 0.2s ease; }
                .fin-row:hover { background-color: #FBFCFE !important; }
                .modal-overlay { animation: fadeIn 0.2s ease-out forwards; }
                .modal-content { animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .receipt-btn { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; }
                .receipt-btn:hover { background: #E0E7FF; border-color: #A5B4FC; }
                .receipt-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; cursor: pointer; border: 1px solid #E2E8F0; transition: all 0.15s; }
                .receipt-thumb:hover { transform: scale(1.05); border-color: #4F46E5; }
            `}</style>

            {loading ? (
                <div style={styles.centeredState}>Загрузка данных...</div>
            ) : payments.length === 0 ? (
                <div style={styles.centeredState}>История транзакций пока пуста.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={{ ...styles.th, textAlign: 'center', width: '60px' }}>ID</th>
                                <th style={styles.th}>Студент</th>
                                <th style={styles.th}>Группа</th>
                                <th style={styles.th}>Тип</th>
                                <th style={styles.th}>Сумма</th>
                                <th style={styles.th}>Метод</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Чек</th>
                                <th style={styles.th}>Дата</th>
                                <th style={styles.th}>Статус</th>
                                <th style={{ ...styles.th, textAlign: 'center', width: '110px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => {
                                const confirmed = checkIsConfirmed(p);
                                const typeCfg = getTypeConfig(p);
                                const receiptUrl = getReceiptUrl(p);
                                const courseFee = isCourseFee(p);
                                const dateStr = (p as any).date || (p as any).createdAt || (p as any).paymentDate;

                                return (
                                    <tr key={p.id} className="fin-row" style={styles.tr}>
                                        <td style={{ ...styles.td, textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>
                                            #{p.id}
                                        </td>

                                        <td style={{ ...styles.td, fontWeight: 600, color: '#0F172A' }}>
                                            {p.studentFullName}
                                        </td>

                                        <td style={styles.td}>{p.groupName || '—'}</td>

                                        <td style={styles.td}>
                                            <span style={{ ...styles.typeBadge, background: typeCfg.bg, color: typeCfg.color }}>
                                                {typeCfg.label}
                                            </span>
                                        </td>

                                        <td style={{ ...styles.td, fontWeight: 700, color: typeCfg.amountColor, whiteSpace: 'nowrap' }}>
                                            {typeCfg.sign}{Number(p.amount).toLocaleString()} TJS
                                        </td>

                                        <td style={styles.td}>
                                            <span style={styles.methodBadge}>{p.method || '—'}</span>
                                        </td>

                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            {receiptUrl ? (
                                                isImageReceipt(receiptUrl) ? (
                                                    <img src={receiptUrl} alt="Чек" className="receipt-thumb"
                                                        onClick={() => setReceiptPreview(receiptUrl)} />
                                                ) : (
                                                    <button className="receipt-btn"
                                                        onClick={() => window.open(receiptUrl, '_blank')}
                                                        title="Открыть документ">
                                                        <FileText size={13} /> Документ
                                                    </button>
                                                )
                                            ) : (
                                                <span style={styles.noReceipt}>—</span>
                                            )}
                                        </td>

                                        <td style={{ ...styles.td, color: '#64748B', whiteSpace: 'nowrap' }}>
                                            {fmtDate(dateStr)}
                                        </td>

                                        {/* Статус: для оплаты за курс — "Оплачено", иначе обычный статус */}
                                        <td style={styles.td}>
                                            {courseFee && confirmed ? (
                                                <span style={{ ...styles.status, background: '#EFF6FF', color: '#1D4ED8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle2 size={13} /> Оплачено
                                                </span>
                                            ) : confirmed ? (
                                                <span style={{ ...styles.status, background: '#E2F5EA', color: '#10B981' }}>
                                                    Проведён
                                                </span>
                                            ) : (
                                                <span style={{ ...styles.status, background: '#FFF1E6', color: '#F2994A' }}>
                                                    Проверка
                                                </span>
                                            )}
                                        </td>

                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            <div style={styles.actions}>
                                                {!confirmed && (
                                                    <button onClick={() => onConfirm(p.id)}
                                                        style={{ ...styles.btn, color: '#10B981', background: '#E2F5EA' }}
                                                        title="Подтвердить платёж">
                                                        <Check size={14} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteClick(p.id)}
                                                    style={{
                                                        ...styles.btn, color: '#EF4444', background: '#FCEBEB',
                                                        opacity: confirmed ? 0.4 : 1,
                                                        cursor: confirmed ? 'not-allowed' : 'pointer',
                                                    }}
                                                    disabled={confirmed}
                                                    title={confirmed ? 'Нельзя удалить проведённый платёж' : 'Удалить транзакцию'}>
                                                    <Trash2 size={14} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="modal-overlay" style={styles.modalOverlay}>
                    <div className="modal-content" style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <div style={styles.warningIconWrapper}>
                                <AlertTriangle size={20} color="#EF4444" />
                            </div>
                            <h3 style={styles.modalTitle}>Подтверждение удаления</h3>
                            <button onClick={() => setIsDeleteModalOpen(false)} style={styles.closeBtn}>
                                <X size={18} color="#94A3B8" />
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            Вы действительно хотите безвозвратно удалить транзакцию{' '}
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>#{selectedPaymentId}</span>
                            ? Данное действие нельзя отменить.
                        </div>
                        <div style={styles.modalFooter}>
                            <button onClick={() => setIsDeleteModalOpen(false)} style={styles.cancelBtn}>Отмена</button>
                            <button onClick={handleConfirmDelete} style={styles.deleteBtn}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

            {receiptPreview && (
                <div className="modal-overlay"
                    style={{ ...styles.modalOverlay, backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
                    onClick={() => setReceiptPreview(null)}>
                    <div className="modal-content" style={styles.receiptPreviewWrapper}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={styles.receiptPreviewHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ImageIcon size={18} color="#4F46E5" />
                                <h3 style={styles.modalTitle}>Чек платежа</h3>
                            </div>
                            <button onClick={() => setReceiptPreview(null)} style={styles.closeBtn}>
                                <X size={20} color="#94A3B8" />
                            </button>
                        </div>
                        <img src={receiptPreview} alt="Чек" style={styles.receiptFullImage} />
                        <div style={styles.receiptPreviewFooter}>
                            <button onClick={() => window.open(receiptPreview, '_blank')} style={styles.openBtn}>
                                <Eye size={14} /> Открыть в новой вкладке
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: { background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' } as React.CSSProperties,
    thRow: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } as React.CSSProperties,
    th: { padding: '12px 16px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.04em', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    tr: { borderBottom: '1px solid #F1F5F9', background: '#ffffff' } as React.CSSProperties,
    td: { padding: '12px 16px', color: '#475569', verticalAlign: 'middle' as const } as React.CSSProperties,
    typeBadge: { padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, display: 'inline-block', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    methodBadge: { background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' as const } as React.CSSProperties,
    noReceipt: { color: '#CBD5E1', fontSize: '14px', fontWeight: 400 } as React.CSSProperties,
    status: { padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'inline-block' } as React.CSSProperties,
    actions: { display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' } as React.CSSProperties,
    btn: { border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' } as React.CSSProperties,
    centeredState: { padding: '50px 20px', textAlign: 'center' as const, color: '#64748B', fontSize: '14px', fontWeight: 500 } as React.CSSProperties,
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' } as React.CSSProperties,
    modalContent: { background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '24px' } as React.CSSProperties,
    modalHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' } as React.CSSProperties,
    warningIconWrapper: { background: '#FCEBEB', padding: '8px', borderRadius: '10px', display: 'flex' } as React.CSSProperties,
    modalTitle: { fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0, flexGrow: 1 } as React.CSSProperties,
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' } as React.CSSProperties,
    modalBody: { fontSize: '14px', color: '#475569', lineHeight: '1.5', marginBottom: '24px' } as React.CSSProperties,
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } as React.CSSProperties,
    cancelBtn: { background: '#F1F5F9', border: 'none', color: '#475569', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    deleteBtn: { background: '#EF4444', border: 'none', color: '#ffffff', padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' } as React.CSSProperties,
    receiptPreviewWrapper: { background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', padding: '20px', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } as React.CSSProperties,
    receiptPreviewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' } as React.CSSProperties,
    receiptFullImage: { width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' as const, borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC' } as React.CSSProperties,
    receiptPreviewFooter: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' } as React.CSSProperties,
    openBtn: { background: '#4F46E5', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
};