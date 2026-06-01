import React from 'react';
import {
    Wallet,
    ArrowUpRight,
    AlertCircle,
    Undo2,
    Gift,
    Percent
} from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceStatsProps {
    payments: PaymentListItem[];
}

const isType = (p: any, ...names: string[]): boolean => {
    if (!p.type) return false;
    const t = String(p.type).toLowerCase();
    return names.some(n => t === n.toLowerCase());
};

const checkIsConfirmed = (p: any): boolean => {
    if (p.isConfirmed === true || p.isConfirmed === 'true') return true;
    if (p.status) {
        const s = String(p.status).toLowerCase();
        return s === 'проведен' || s === 'completed' || s === 'success' || s === 'approved';
    }
    return false;
};

// ─── Извлекаем уникальный идентификатор студента ──────────────────────────
// Если есть studentId — используем его. Если нет — используем имя.
// Это защищает от ситуации когда два разных студента имеют одно имя,
// но если studentId есть — он приоритетен.
const getStudentKey = (p: any): string | number | null => {
    if (p.studentId !== undefined && p.studentId !== null) {
        return `id-${p.studentId}`;
    }
    if (p.studentFullName) {
        return `name-${String(p.studentFullName).trim().toLowerCase()}`;
    }
    return null;
};

// ─── Подсчёт статистики ───────────────────────────────────────────────────
interface TypeStats {
    confirmed: number;       // сумма подтверждённых операций
    pending: number;         // сумма в ожидании
    count: number;           // количество операций
    uniqueStudents: number;  // количество УНИКАЛЬНЫХ студентов
}

const calcStats = (payments: PaymentListItem[], ...typeNames: string[]): TypeStats => {
    const filtered = payments.filter(p => isType(p, ...typeNames));
    const confirmedItems = filtered.filter(checkIsConfirmed);
    const pendingItems = filtered.filter(p => !checkIsConfirmed(p));

    // ✅ Считаем уникальных студентов через Set
    const uniqueStudentSet = new Set<string | number>();
    confirmedItems.forEach(p => {
        const key = getStudentKey(p);
        if (key !== null) uniqueStudentSet.add(key);
    });

    return {
        confirmed: confirmedItems.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        pending: pendingItems.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        count: confirmedItems.length,
        uniqueStudents: uniqueStudentSet.size,
    };
};

const fmt = (n: number) => n.toLocaleString('ru-RU');

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────────

export const FinanceStats: React.FC<FinanceStatsProps> = ({ payments }) => {
    const paymentStats = calcStats(payments, 'payment', 'income', '1', '0');
    const debtStats = calcStats(payments, 'debt', '2');
    const refundStats = calcStats(payments, 'refund', '3');
    const bonusStats = calcStats(payments, 'bonus', '4');
    const discountStats = calcStats(payments, 'discount', '5');

    const totalBalance = paymentStats.confirmed - refundStats.confirmed;

    const cards = [
        {
            label: 'Общий баланс',
            value: totalBalance,
            valueColor: totalBalance >= 0 ? '#0F172A' : '#EF4444',
            valuePrefix: '',
            icon: <Wallet size={16} color="#4F46E5" />,
            iconBg: '#EEF2FF',
            footer: 'Чистый поток (Оплаты − Возвраты)',
            footerColor: '#94A3B8',
        },
        {
            label: 'Оплаты',
            value: paymentStats.confirmed,
            valueColor: '#10B981',
            valuePrefix: '+',
            icon: <ArrowUpRight size={16} color="#10B981" />,
            iconBg: '#E2F5EA',
            footer: paymentStats.pending > 0
                ? `${fmt(paymentStats.pending)} TJS ждёт проверки`
                : `${paymentStats.uniqueStudents} ${paymentStats.uniqueStudents === 1 ? 'студент оплатил' : 'студентов оплатили'}`,
            footerColor: paymentStats.pending > 0 ? '#F59E0B' : '#94A3B8',
            footerBold: paymentStats.pending > 0,
        },
        {
            label: 'Долги',
            value: debtStats.confirmed,
            valueColor: '#F59E0B',
            valuePrefix: '',
            icon: <AlertCircle size={16} color="#F59E0B" />,
            iconBg: '#FEF3C7',
            // ✅ Используем uniqueStudents вместо count
            footer: `${debtStats.uniqueStudents} ${debtStats.uniqueStudents === 1 ? 'студент в долгу' : 'студентов в долгу'}`,
            footerColor: '#94A3B8',
        },
        {
            label: 'Возвраты',
            value: refundStats.confirmed,
            valueColor: '#EF4444',
            valuePrefix: '−',
            icon: <Undo2 size={16} color="#EF4444" />,
            iconBg: '#FCEBEB',
            footer: `${refundStats.count} ${refundStats.count === 1 ? 'возврат' : 'возвратов'} выполнено`,
            footerColor: '#94A3B8',
        },
        {
            label: 'Бонусы',
            value: bonusStats.confirmed,
            valueColor: '#8B5CF6',
            valuePrefix: '+',
            icon: <Gift size={16} color="#8B5CF6" />,
            iconBg: '#F3E8FF',
            footer: `${bonusStats.count} ${bonusStats.count === 1 ? 'начисление' : 'начислений'}`,
            footerColor: '#94A3B8',
        },
        {
            label: 'Скидки',
            value: discountStats.confirmed,
            valueColor: '#0EA5E9',
            valuePrefix: '',
            icon: <Percent size={16} color="#0EA5E9" />,
            iconBg: '#E0F2FE',
            footer: `${discountStats.count} ${discountStats.count === 1 ? 'скидка применена' : 'скидок применено'}`,
            footerColor: '#94A3B8',
        },
    ];

    return (
        <div style={styles.grid}>
            <style>{`
                .stat-card {
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -5px rgba(0,0,0,0.05);
                }
            `}</style>

            {cards.map((c, idx) => (
                <div key={idx} className="stat-card" style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.label}>{c.label}</span>
                        <div style={{ ...styles.iconBox, background: c.iconBg }}>
                            {c.icon}
                        </div>
                    </div>
                    <div style={{ ...styles.value, color: c.valueColor }}>
                        {c.valuePrefix}{fmt(c.value)} TJS
                    </div>
                    <div style={{
                        ...styles.footerText,
                        color: c.footerColor,
                        fontWeight: c.footerBold ? 600 : 400,
                    }}>
                        {c.footer}
                    </div>
                </div>
            ))}
        </div>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    } as React.CSSProperties,

    card: {
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        minHeight: '120px',
    } as React.CSSProperties,

    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    } as React.CSSProperties,

    label: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#64748B',
    } as React.CSSProperties,

    iconBox: {
        padding: '8px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
    } as React.CSSProperties,

    value: {
        fontSize: '22px',
        fontWeight: 700,
        color: '#0F172A',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
    } as React.CSSProperties,

    footerText: {
        fontSize: '12px',
        marginTop: '6px',
    } as React.CSSProperties,
};