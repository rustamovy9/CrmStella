// components/ui/billing/ChargeStudentButton.tsx
import React, { useState } from 'react';
import { CreditCard, AlertTriangle, Check, X } from 'lucide-react';
import { billingService, type BillingResult } from '../../../api/billingService';

interface Props {
    studentId: number;
    groupId: number;
    studentName: string;
    onCharged?: (result: BillingResult) => void;
}

export const ChargeStudentButton: React.FC<Props> = ({
    studentId, groupId, studentName, onCharged
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BillingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCharge = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await billingService.chargeStudent(studentId, groupId);
            if (res.data.isSuccess && res.data.data) {
                setResult(res.data.data);
                onCharged?.(res.data.data);
            } else {
                setError(res.data.error || 'Ошибка списания');
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Не удалось списать оплату');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setResult(null);
        setError(null);
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                style={s.triggerBtn}
                title="Списать месячную оплату"
            >
                <CreditCard size={14} />
                <span>Списать</span>
            </button>

            {isModalOpen && (
                <div style={s.overlay} onClick={handleClose}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <div style={s.header}>
                            <div style={s.iconWrap}>
                                <CreditCard size={20} color="#4F46E5" />
                            </div>
                            <h3 style={s.title}>Списание оплаты</h3>
                            <button onClick={handleClose} style={s.closeBtn}>
                                <X size={18} color="#94A3B8" />
                            </button>
                        </div>

                        {!result && !error && (
                            <>
                                <div style={s.body}>
                                    Списать месячную оплату со счёта{' '}
                                    <span style={s.studentName}>{studentName}</span>?
                                    Если на балансе недостаточно средств, будет создана запись долга.
                                </div>
                                <div style={s.footer}>
                                    <button onClick={handleClose} style={s.cancelBtn}>
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleCharge}
                                        disabled={isLoading}
                                        style={{
                                            ...s.confirmBtn,
                                            opacity: isLoading ? 0.6 : 1,
                                            cursor: isLoading ? 'wait' : 'pointer',
                                        }}
                                    >
                                        {isLoading ? 'Списываем...' : 'Подтвердить списание'}
                                    </button>
                                </div>
                            </>
                        )}

                        {result && (
                            <div>
                                <div style={s.successHeader}>
                                    <Check size={20} color="#10B981" />
                                    <span style={s.successTitle}>Списание выполнено</span>
                                </div>
                                <div style={s.resultGrid}>
                                    <div style={s.resultRow}>
                                        <span style={s.resultLabel}>Сумма списания</span>
                                        <span style={s.resultValue}>
                                            {result.amountCharged.toLocaleString()} TJS
                                        </span>
                                    </div>
                                    <div style={s.resultRow}>
                                        <span style={s.resultLabel}>Баланс до</span>
                                        <span style={s.resultValue}>
                                            {result.balanceBefore.toLocaleString()} TJS
                                        </span>
                                    </div>
                                    <div style={s.resultRow}>
                                        <span style={s.resultLabel}>Баланс после</span>
                                        <span style={{
                                            ...s.resultValue,
                                            color: result.wentNegative ? '#EF4444' : '#10B981',
                                            fontWeight: 700,
                                        }}>
                                            {result.balanceAfter.toLocaleString()} TJS
                                        </span>
                                    </div>
                                    {result.wentNegative && result.debtAmount && (
                                        <div style={s.debtBanner}>
                                            <AlertTriangle size={16} color="#B45309" />
                                            <span>
                                                Создан долг на сумму{' '}
                                                <strong>{result.debtAmount.toLocaleString()} TJS</strong>
                                            </span>
                                        </div>
                                    )}
                                    <div style={s.resultRow}>
                                        <span style={s.resultLabel}>Следующее списание</span>
                                        <span style={s.resultValue}>
                                            {new Date(result.nextBillingDate).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>
                                <div style={s.footer}>
                                    <button onClick={handleClose} style={s.confirmBtn}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div>
                                <div style={s.errorBanner}>
                                    <AlertTriangle size={20} color="#EF4444" />
                                    <span>{error}</span>
                                </div>
                                <div style={s.footer}>
                                    <button onClick={handleClose} style={s.cancelBtn}>
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

const s = {
    triggerBtn: {
        background: '#EEF2FF',
        color: '#4F46E5',
        border: '1px solid #C7D2FE',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s',
    } as React.CSSProperties,

    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
    } as React.CSSProperties,

    modal: {
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    } as React.CSSProperties,

    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    } as React.CSSProperties,

    iconWrap: {
        background: '#EEF2FF',
        padding: '8px',
        borderRadius: '10px',
        display: 'flex',
    } as React.CSSProperties,

    title: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#0F172A',
        margin: 0,
        flexGrow: 1,
    } as React.CSSProperties,

    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
    } as React.CSSProperties,

    body: {
        fontSize: '14px',
        color: '#475569',
        lineHeight: 1.5,
        marginBottom: '20px',
    } as React.CSSProperties,

    studentName: {
        fontWeight: 700,
        color: '#0F172A',
    } as React.CSSProperties,

    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '16px',
    } as React.CSSProperties,

    cancelBtn: {
        background: '#F1F5F9',
        border: 'none',
        color: '#475569',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    } as React.CSSProperties,

    confirmBtn: {
        background: '#4F46E5',
        border: 'none',
        color: '#FFFFFF',
        padding: '10px 18px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
    } as React.CSSProperties,

    successHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: '#ECFDF5',
        borderRadius: '10px',
        marginBottom: '16px',
    } as React.CSSProperties,

    successTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#10B981',
    } as React.CSSProperties,

    resultGrid: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        padding: '4px 0',
    } as React.CSSProperties,

    resultRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #F1F5F9',
    } as React.CSSProperties,

    resultLabel: {
        fontSize: '13px',
        color: '#64748B',
    } as React.CSSProperties,

    resultValue: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#0F172A',
    } as React.CSSProperties,

    debtBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        background: '#FEF3C7',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#B45309',
        marginTop: '4px',
    } as React.CSSProperties,

    errorBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: '#FEF2F2',
        border: '1px solid #FEE2E2',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#EF4444',
        fontWeight: 500,
    } as React.CSSProperties,
};