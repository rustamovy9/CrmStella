// pages/Finance/components/FinanceStats.tsx
import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';

interface FinanceStatsProps {
    payments: PaymentListItem[];
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({ payments }) => {
    // Хелпер для определения Доходов (учитываем "Payment" из вашего API)
    const isIncomeType = (p: any) => {
        if (!p.type) return true; // Если тип не указан, считаем доходом (оплатой от студента)
        const t = String(p.type).toLowerCase();
        return t === 'income' || t === 'payment' || t === '0' || t === 'доход';
    };

    // Хелпер для определения Расходов
    const isExpenseType = (p: any) => {
        if (!p.type) return false;
        const t = String(p.type).toLowerCase();
        return t === 'expense' || t === '1' || t === 'расход';
    };

    // Хелпер для проверки подтверждения (обрабатываем "Проведен" и "Проверка")
    const checkIsConfirmed = (p: any) => {
        if (p.isConfirmed === true || p.isConfirmed === 'true') return true;
        if (p.status) {
            const s = String(p.status).toLowerCase();
            return s === 'проведен' || s === 'completed' || s === 'success' || s === '1' || s === 'approved';
        }
        return false;
    };

    // Динамический расчет на основе реальных данных из API
    const incomeConfirmed = payments
        .filter(p => isIncomeType(p) && checkIsConfirmed(p))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const incomePending = payments
        .filter(p => isIncomeType(p) && !checkIsConfirmed(p))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const expenseTotal = payments
        .filter(p => isExpenseType(p))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const totalBalance = incomeConfirmed - expenseTotal;

    return (
        <div style={styles.grid}>
            <style>{`
                .stat-card { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease; }
                .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.05); }
            `}</style>

            <div className="stat-card" style={styles.card}>
                <div style={styles.cardHeader}>
                    <span style={styles.label}>Общий баланс</span>
                    <div style={{ ...styles.iconBox, background: '#EEF2FF' }}><Wallet size={16} color="#4F46E5" /></div>
                </div>
                <div style={styles.value}>{totalBalance.toLocaleString()} TJS</div>
                <div style={styles.footerText}>Доступные подтвержденные средства</div>
            </div>

            <div className="stat-card" style={styles.card}>
                <div style={styles.cardHeader}>
                    <span style={styles.label}>Доходы</span>
                    <div style={{ ...styles.iconBox, background: '#E2F5EA' }}><ArrowUpRight size={16} color="#10B981" /></div>
                </div>
                <div style={{ ...styles.value, color: '#10B981' }}>+{incomeConfirmed.toLocaleString()} TJS</div>
                <div style={styles.footerText}>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{incomePending.toLocaleString()} TJS</span> ожидает проверки
                </div>
            </div>

            <div className="stat-card" style={styles.card}>
                <div style={styles.cardHeader}>
                    <span style={styles.label}>Расходы</span>
                    <div style={{ ...styles.iconBox, background: '#FCEBEB' }}><ArrowDownRight size={16} color="#EF4444" /></div>
                </div>
                <div style={{ ...styles.value, color: '#EF4444' }}>{expenseTotal.toLocaleString()} TJS</div>
                <div style={styles.footerText}>Выплаты и возвраты студентам</div>
            </div>
        </div>
    );
};

const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' },
    card: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    label: { fontSize: '14px', fontWeight: 500, color: '#64748B' },
    iconBox: { padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' },
    value: { fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' },
    footerText: { fontSize: '12px', color: '#94A3B8', marginTop: '6px' }
};