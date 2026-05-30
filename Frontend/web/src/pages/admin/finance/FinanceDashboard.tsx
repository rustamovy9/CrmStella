// pages/Finance/FinanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { PaymentListItem } from '../../../types/finance';
import { financeService } from '../../../api/paymentService';

import { FinanceStats } from '../../../components/ui/finance/FinanceStats';
import { FinanceChart } from '../../../components/ui/finance/FinanceChart';
import { FinanceTable } from '../../../components/ui/finance/FinanceTable';

import groupService from '../../../api/groupService';
import adminService from '../../../api/adminService';
import { CreatePaymentModal } from '../../../components/ui/finance/CreatePaymentModal';

interface SelectionItem {
    id: number;
    name: string;
}

const FinanceDashboard: React.FC = () => {
    const [payments, setPayments] = useState<PaymentListItem[]>([]);
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

            const studentsPromise = adminService.getStudents(1, 100)
                .then(res => res.data)
                .catch(() => ({ isSuccess: false, data: { items: [] } }));

            const groupsPromise = groupService.getAll({ page: 1, pageSize: 100 })
                .then(res => res.data)
                .catch(() => ({ isSuccess: false, data: { items: [] } }));

            const [paymentsRes, studentsRes, groupsRes] = await Promise.all([
                paymentsPromise,
                studentsPromise,
                groupsPromise
            ]);

            if (paymentsRes.isSuccess && paymentsRes.data) {
                setPayments(paymentsRes.data);
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
            }
        } catch {
            alert('Ошибка подтверждения операции');
        }
    };

    // FIX: Убрали window.confirm, так как FinanceTable сама показывает красивое окно удаления
    const handleDelete = async (id: number) => {
        try {
            const res = await financeService.delete(id);
            if (res.isSuccess) {
                setPayments(prev => prev.filter(p => p.id !== id));
            }
        } catch {
            alert('Ошибка удаления операции');
        }
    };

    const handleModalSubmit = async (formData: any) => {
        try {
            const res = await financeService.create(formData);
            if (res.isSuccess) {
                setIsModalOpen(false);
                loadDashboardData();
            }
        } catch {
            alert('Ошибка добавления транзакции.');
        }
    };

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

            {/* Сводные метрики */}
            <FinanceStats payments={payments} />

            {/* График */}
            <FinanceChart payments={payments} />

            {/* Таблица со списком операций */}
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
};

export default FinanceDashboard;