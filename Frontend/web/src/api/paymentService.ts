// api/paymentService.ts
import type { ApiResult } from "../types/auth";
import type { PaymentListItem, CreatePaymentRequest } from "../types/finance";
import agent from "./agent";

export const financeService = {
    getDashboard: async () => {
        const response = await agent.get<ApiResult<FinanceDashboardResponse>>('/payments/dashboard');
        return response.data;
    },

    getAll: async () => {
        const response = await agent.get<ApiResult<PaymentListItem[]>>('/payments');
        return response.data;
    },

    getByStudentId: async (studentId: number) => {
        const response = await agent.get<ApiResult<PaymentListItem[]>>(`/payments/student/${studentId}`);
        return response.data;
    },

    create: async (params: CreatePaymentRequest) => {
        const formData = new FormData();
        formData.append('studentId', params.studentId.toString());
        formData.append('groupId', params.groupId.toString());
        formData.append('amount', params.amount.toString());
        formData.append('type', params.type.toString());
        formData.append('method', params.method.toString());
        if (params.dueDate) formData.append('dueDate', params.dueDate);
        if (params.note) formData.append('note', params.note.trim());
        if (params.receipt instanceof File) formData.append('receipt', params.receipt);

        const response = await agent.post<ApiResult<any>>('/payments', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // ✅ НОВОЕ: пополнение счёта — БЕЗ группы
    topUp: async (params: TopUpParams) => {
        const formData = new FormData();
        formData.append('StudentId', params.studentId.toString());
        formData.append('Amount', params.amount.toString());
        formData.append('Method', params.method.toString());
        if (params.note) formData.append('Note', params.note.trim());
        if (params.receipt instanceof File) formData.append('Receipt', params.receipt);

        const response = await agent.post<ApiResult<any>>('/payments/top-up', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    confirm: async (id: number, isConfirmed: boolean) => {
        const response = await agent.patch<ApiResult<boolean>>(`/payments/${id}/confirm`, { isConfirmed });
        return response.data;
    },

    delete: async (id: number) => {
        const response = await agent.delete<ApiResult<boolean>>(`/payments/${id}`);
        return response.data;
    },
};

export interface TopUpParams {
    studentId: number;
    amount: number;
    method: number;
    note?: string;
    receipt?: File | null;
}

export interface FinanceDashboardResponse {
    totalBalance: number;
    totalDebt: number;
    studentsInDebt: number;
    totalIncome: number;
    studentsPaid: number;
    revenue: number;       // ← новое
    refunded: number;      // ← новое
    netRevenue: number;    // ← новое
}