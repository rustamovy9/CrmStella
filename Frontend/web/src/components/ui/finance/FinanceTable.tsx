// pages/Finance/components/FinanceTable.tsx
import React, { useState } from 'react';
import { Check, Trash2, AlertTriangle, X } from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceTableProps {
    payments: PaymentListItem[];
    loading: boolean;
    onConfirm: (id: number) => void;
    onDelete: (id: number) => void;
}

export const FinanceTable: React.FC<FinanceTableProps> = ({ payments, loading, onConfirm, onDelete }) => {
    // Состояние для красивой модалки удаления
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

    // Функция гибкой проверки: проведен ли платеж (синхронизировано с API)
    const checkIsConfirmed = (p: any) => {
        if (p.isConfirmed === true || p.isConfirmed === 'true') return true;
        if (p.status) {
            const s = String(p.status).toLowerCase();
            return s === 'проведен' || s === 'completed' || s === 'success' || s === '1';
        }
        return false;
    };

    // Функция проверки расходов для корректной подсветки цвета суммы
    const isExpenseType = (p: any) => {
        if (!p.type) return false;
        const t = String(p.type).toLowerCase();
        return t === 'expense' || t === '1' || t === 'расход';
    };

    // Открытие модального окна подтверждения
    const handleDeleteClick = (id: number) => {
        setSelectedPaymentId(id);
        setIsModalOpen(true);
    };

    // Подтверждение удаления внутри модалки
    const handleConfirmDelete = () => {
        if (selectedPaymentId !== null) {
            onDelete(selectedPaymentId);
            setIsModalOpen(false);
            setSelectedPaymentId(null);
        }
    };

    return (
        <div style={styles.wrapper}>
            {/* Внедрение CSS-анимаций для эффекта появления строк и модалки */}
            <style>{`
                .fin-row { transition: background-color 0.2s ease; }
                .fin-row:hover { background-color: #F8FAFC !important; }
                .modal-overlay { animation: fadeIn 0.2s ease-out forwards; }
                .modal-content { animation: scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            {loading ? (
                <div style={styles.centeredState}>Загрузка данных учетных записей...</div>
            ) : payments.length === 0 ? (
                <div style={styles.centeredState}>История транзакций пока пуста.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={{ ...styles.th, textAlign: 'center', width: '70px' }}>ID</th>
                                <th style={styles.th}>Студент</th>
                                <th style={styles.th}>Группа</th>
                                <th style={styles.th}>Сумма</th>
                                <th style={styles.th}>Метод</th>
                                <th style={styles.th}>Статус</th>
                                <th style={{ ...styles.th, textAlign: 'center', width: '110px' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => {
                                const confirmed = checkIsConfirmed(p);
                                const expense = isExpenseType(p);

                                return (
                                    <tr key={p.id} className="fin-row" style={styles.tr}>
                                        <td style={{ ...styles.td, textAlign: 'center', color: '#94A3B8', fontWeight: 500 }}>#{p.id}</td>
                                        <td style={{ ...styles.td, fontWeight: 600, color: '#0F172A' }}>{p.studentFullName}</td>
                                        <td style={styles.td}>{p.groupName || '—'}</td>
                                        <td style={{ ...styles.td, fontWeight: 700, color: expense ? '#EF4444' : '#10B981' }}>
                                            {expense ? '-' : '+'}{Number(p.amount).toLocaleString()} TJS
                                        </td>
                                        <td style={styles.td}>
                                            <span style={styles.badge}>{p.method || 'Онлайн'}</span>
                                        </td>
                                        <td style={styles.td}>
                                            {confirmed ? (
                                                <span style={{ ...styles.status, background: '#E2F5EA', color: '#10B981' }}>Проведен</span>
                                            ) : (
                                                <span style={{ ...styles.status, background: '#FFF1E6', color: '#F2994A' }}>Проверка</span>
                                            )}
                                        </td>
                                        <td style={{ ...styles.td, textAlign: 'center' }}>
                                            <div style={styles.actions}>
                                                {!confirmed && (
                                                    <button 
                                                        onClick={() => onConfirm(p.id)}
                                                        style={{ ...styles.btn, color: '#10B981', background: '#E2F5EA' }}
                                                        title="Подтвердить платеж"
                                                    >
                                                        <Check size={14} strokeWidth={2.5} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteClick(p.id)}
                                                    style={{ 
                                                        ...styles.btn, 
                                                        color: '#EF4444', 
                                                        background: '#FCEBEB',
                                                        opacity: confirmed ? 0.4 : 1,
                                                        cursor: confirmed ? 'not-allowed' : 'pointer'
                                                    }}
                                                    disabled={confirmed}
                                                    title={confirmed ? "Нельзя удалить проведенный платеж" : "Удалить транзакцию"}
                                                >
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

            {/* Красивое Красное Модальное Окно подтверждения удаления */}
            {isModalOpen && (
                <div className="modal-overlay" style={styles.modalOverlay}>
                    <div className="modal-content" style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <div style={styles.warningIconWrapper}>
                                <AlertTriangle size={20} color="#EF4444" />
                            </div>
                            <h3 style={styles.modalTitle}>Подтверждение удаления</h3>
                            <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>
                                <X size={18} color="#94A3B8" />
                            </button>
                        </div>
                        
                        <div style={styles.modalBody}>
                            Вы действительно хотите безвозвратно удалить транзакцию <span style={{ fontWeight: 700, color: '#0F172A' }}>#{selectedPaymentId}</span>? Данное действие нельзя будет отменить.
                        </div>

                        <div style={styles.modalFooter}>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                style={styles.cancelBtn}
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleConfirmDelete} 
                                style={styles.deleteBtn}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    wrapper: { background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
    thRow: { background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
    th: { padding: '14px 20px', textAlign: 'left' as const, fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #F1F5F9', background: '#ffffff' },
    td: { padding: '14px 20px', color: '#475569', verticalAlign: 'middle' },
    badge: { background: '#F1F5F9', color: '#475569', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500 },
    status: { padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'inline-block' },
    actions: { display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' },
    btn: { border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' },
    centeredState: { padding: '50px 20px', textAlign: 'center' as const, color: '#64748B', fontSize: '14px', fontWeight: 500 },
    
    // Стили для премиум-модалки
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
    },
    modalContent: {
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        padding: '24px',
        position: 'relative' as const
    },
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px'
    },
    warningIconWrapper: {
        background: '#FCEBEB',
        padding: '8px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#0F172A',
        margin: 0,
        flexGrow: 1
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center'
    },
    modalBody: {
        fontSize: '14px',
        color: '#475569',
        lineHeight: '1.5',
        marginBottom: '24px'
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    cancelBtn: {
        background: '#F1F5F9',
        border: 'none',
        color: '#475569',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    deleteBtn: {
        background: '#EF4444',
        border: 'none',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
        transition: 'background 0.2s'
    }
};