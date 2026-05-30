// api/paymentService.ts
import type { ApiResult } from "../types/auth";
import type { PaymentListItem, CreatePaymentRequest } from "../types/finance";
import agent from "./agent";

export const financeService = {
    // GET: api/payments
    getAll: async () => {
        const response = await agent.get<ApiResult<PaymentListItem[]>>('/payments');
        return response.data;
    },

    // GET: api/payments/student/{studentId}
    getByStudentId: async (studentId: number) => {
        const response = await agent.get<ApiResult<PaymentListItem[]>>(`/payments/student/${studentId}`);
        return response.data;
    },

    // POST: api/payments (Принимает FromForm)
    create: async (params: CreatePaymentRequest) => {
        const formData = new FormData();
        
        formData.append('studentId', params.studentId.toString());
        formData.append('groupId', params.groupId.toString());
        formData.append('amount', params.amount.toString());
        formData.append('type', params.type.toString());
        formData.append('method', params.method.toString());
        
        if (params.dueDate) {
            formData.append('dueDate', params.dueDate);
        }
        if (params.note) {
            formData.append('note', params.note.trim());
        }
        if (params.receipt instanceof File) {
            formData.append('receipt', params.receipt);
        }

        const response = await agent.post<ApiResult<any>>('/payments', formData, {
            headers: {
                // Axios сам выставит правильный boundary, если передать multipart/form-data
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // PATCH: api/payments/{id}/confirm
    confirm: async (id: number, isConfirmed: boolean) => {
        const response = await agent.patch<ApiResult<boolean>>(`/payments/${id}/confirm`, {
            isConfirmed
        });
        return response.data;
    },

    // DELETE: api/payments/{id}
    delete: async (id: number) => {
        const response = await agent.delete<ApiResult<boolean>>(`/payments/${id}`);
        return response.data;
    }
};