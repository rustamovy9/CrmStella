// pages/Finance/FinanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Plus, Wallet, ArrowUpRight, AlertTriangle,
    ArrowDownLeft, Gift, Percent
} from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';
import { financeService } from '../../../api/paymentService';
import type { FinanceDashboardResponse } from '../../../api/paymentService';

import { PremiumMetricCard } from '../../../components/ui/PremiumMetricCard';
import { FinanceChart } from '../../../components/ui/finance/FinanceChart';
import { FinanceTable } from '../../../components/ui/finance/FinanceTable';

import groupService from '../../../api/groupService';
import adminService from '../../../api/adminService';
import { CreatePaymentModal } from '../../../components/ui/finance/CreatePaymentModal';

interface SelectionItem {
    id: number;
    name: string;
}

// ─── ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПОДСЧЕТА СТАТИСТИКИ ──────────────────────

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

const getStudentKey = (p: any): string | number | null => {
    if (p.studentId !== undefined && p.studentId !== null) {
        return `id-${p.studentId}`;
    }
    if (p.studentFullName) {
        return `name-${String(p.studentFullName).trim().toLowerCase()}`;
    }
    return null;
};

interface TypeStats {
    confirmed: number;
    pending: number;
    count: number;
    uniqueStudents: number;
}

const calcStats = (payments: PaymentListItem[], ...typeNames: string[]): TypeStats => {
    const filtered = payments.filter(p => isType(p, ...typeNames));
    const confirmedItems = filtered.filter(checkIsConfirmed);
    const pendingItems = filtered.filter(p => !checkIsConfirmed(p));

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

// ─── ГЛАВНЫЙ КОМПОНЕНТ ДАШБОРДА ───────────────────────────────────────────

const FinanceDashboard: React.FC = () => {
    const [payments, setPayments] = useState<PaymentListItem[]>([]);
    const [dashboard, setDashboard] = useState<FinanceDashboardResponse | null>(null);
    const [students, setStudents] = useState<SelectionItem[]>([]);
    const [groups, setGroups] = useState<SelectionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Загрузка данных системы
    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const paymentsPromise = financeService.getAll()
                .catch(() => ({ isSuccess: false, data: [] }));

            const dashboardPromise = financeService.getDashboard()
                .catch(() => ({ isSuccess: false, data: null }));

            const studentsPromise = adminService.getStudents(1, 100)
                .then(res => res.data)
                .catch(() => ({ isSuccess: false, data: { items: [] } }));

            const groupsPromise = groupService.getAll({ page: 1, pageSize: 100 })
                .then(res => res.data)
                .catch(() => ({ isSuccess: false, data: { items: [] } }));

            const [paymentsRes, dashboardRes, studentsRes, groupsRes] = await Promise.all([
                paymentsPromise,
                dashboardPromise,
                studentsPromise,
                groupsPromise
            ]);

            if (paymentsRes.isSuccess && paymentsRes.data) {
                setPayments(paymentsRes.data);
            }

            if (dashboardRes.isSuccess && dashboardRes.data) {
                setDashboard(dashboardRes.data);
            }

            if (studentsRes.isSuccess && studentsRes.data) {
                const studentsList = (studentsRes.data as any).items || (studentsRes.data as any).data || [];
                setStudents(studentsList.map((s: any) => ({
                    id: s.id,
                    name: s.fullName || s.studentName || s.name || `Студент #${s.id}`
                })));
            }

            if (groupsRes.isSuccess && groupsRes.data) {
                const groupsList = (groupsRes.data as any).items || (groupsRes.data as any).data || [];
                setGroups(groupsList.map((g: any) => ({
                    id: g.id,
                    name: g.name || g.title || `Группа #${g.id}`
                })));
            }

        } catch (err) {
            console.error("Критическая ошибка дашборда:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleConfirm = async (id: number) => {
        try {
            const res = await financeService.confirm(id, true);
            if (res.isSuccess) {
                setPayments(prev => prev.map(p => p.id === id ? { ...p, isConfirmed: true } : p));
                loadDashboardData();
            }
        } catch {
            alert('Ошибка подтверждения операции');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await financeService.delete(id);
            if (res.isSuccess) {
                setPayments(prev => prev.filter(p => p.id !== id));
                loadDashboardData();
            }
        } catch {
            alert('Ошибка удаления операции');
        }
    };

    const handleModalSubmit = async (formData: any) => {
        try {
            const res = formData.mode === 'topup'
                ? await financeService.topUp({
                    studentId: formData.studentId,
                    amount: formData.amount,
                    method: formData.method,
                    note: formData.note,
                    receipt: formData.receipt,
                })
                : await financeService.create({
                    studentId: formData.studentId,
                    groupId: formData.groupId,
                    amount: formData.amount,
                    type: formData.type,
                    method: formData.method,
                    note: formData.note,
                    receipt: formData.receipt,
                });

            if (res.isSuccess) {
                setIsModalOpen(false);
                loadDashboardData();
            } else {
                alert(res.error || 'Ошибка добавления транзакции.');
            }
        } catch {
            alert('Ошибка добавления транзакции.');
        }
    };

    // ─── ВЫЧИСЛЕНИЕ СТАТИСТИКИ ─────────────────────────────────────────────
    const paymentStats = calcStats(payments, 'payment', 'income', '1', '0');
    const refundStats = calcStats(payments, 'refund', '3');
    const bonusStats = calcStats(payments, 'bonus', '4');
    const discountStats = calcStats(payments, 'discount', '5');

    const totalBalance = paymentStats.confirmed - refundStats.confirmed;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Финансовый учет</h1>
                    <p style={styles.subtitle}>Мониторинг оплат обучения и верификация чеков</p>
                </div>
                <button style={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} />
                    <span>Создать платеж</span>
                </button>
            </div>

            {/* МЕТРИКИ НА БАЗЕ ОБНОВЛЕННОГО PREMIUM METRIC CARD */}
            <div style={styles.metricsGrid}>
                {/* 1. Общий баланс (Главная карточка) */}
                <PremiumMetricCard
                    isMain={true}
                    label="Общий баланс"
                    value={`${fmt(totalBalance)} TJS`}
                    subLabel="Чистый поток (Оплаты − Возвраты)"
                    icon={<Wallet size={20} color="#FFFFFF" />}
                />

                {/* 2. Оплаты */}
                <PremiumMetricCard
                    variant="green"
                    label="Оплаты"
                    value={`+${fmt(paymentStats.confirmed)}`}
                    subLabel={paymentStats.pending > 0
                        ? `${fmt(paymentStats.pending)} TJS ждёт проверки`
                        : `${paymentStats.uniqueStudents} ${paymentStats.uniqueStudents === 1 ? 'студент оплатил' : 'студентов оплатили'}`
                    }
                    icon={<ArrowUpRight size={20} color="#10B981" />}
                />

                {/* 3. Долги — по реальным балансам (сумма отрицательных балансов) */}
                <PremiumMetricCard
                    variant="amber"
                    label="Долги"
                    value={`${fmt(dashboard?.totalDebt ?? 0)}`}
                    subLabel={`${dashboard?.studentsInDebt ?? 0} ${(dashboard?.studentsInDebt ?? 0) === 1 ? 'студент в долгу' : 'студентов в долгу'}`}
                    icon={<AlertTriangle size={20} color="#F59E0B" />}
                />

                {/* 4. Возвраты */}
                <PremiumMetricCard
                    variant="purple"
                    label="Возвраты"
                    value={`−${fmt(refundStats.confirmed)}`}
                    subLabel={`${refundStats.count} ${refundStats.count === 1 ? 'возврат' : 'возвратов'} выполнено`}
                    icon={<ArrowDownLeft size={20} color="#8B5CF6" />}
                />

                {/* 5. Бонусы */}
                <PremiumMetricCard
                    variant="blue"
                    label="Бонусы"
                    value={`+${fmt(bonusStats.confirmed)}`}
                    subLabel={`${bonusStats.count} ${bonusStats.count === 1 ? 'начисление' : 'начислений'}`}
                    icon={<Gift size={20} color="#0EA5E9" />}
                />

                {/* 6. Скидки */}
                <PremiumMetricCard
                    variant="rose"
                    label="Скидки"
                    value={`${fmt(discountStats.confirmed)}`}
                    subLabel={`${discountStats.count} ${discountStats.count === 1 ? 'скидка' : 'скидок'} применено`}
                    icon={<Percent size={20} color="#EF4444" />}
                />
            </div>

            {/* График */}
            <FinanceChart payments={payments} />

            {/* Table со списком операций */}
            <FinanceTable
                payments={payments}
                loading={loading}
                onConfirm={handleConfirm}
                onDelete={handleDelete}
            />

            {/* Модалка создания */}
            <CreatePaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                students={students}
                groups={groups}
            />
        </div>
    );
};

const styles = {
    container: { padding: '32px', background: '#FAFBFC', minHeight: '100vh', fontFamily: '"Inter", sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 },
    primaryBtn: { background: '#4F46E5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)' },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
    }
};

export default FinanceDashboard;