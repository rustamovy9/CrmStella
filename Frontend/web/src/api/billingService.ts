// api/billingService.ts
import agent from './agent';
import type { ApiResult } from '../types/auth';

export interface BillingResult {
    studentId: number;
    groupId: number;
    amountCharged: number;
    balanceBefore: number;
    balanceAfter: number;
    wentNegative: boolean;
    debtAmount: number | null;
    nextBillingDate: string;
    paymentId: number;
}

export const billingService = {
    // Списать месячную оплату у конкретного студента в группе
    chargeStudent: (studentId: number, groupId: number) =>
        agent.post<ApiResult<BillingResult>>('/billing/charge', {
            studentId,
            groupId,
        }),

    // Прогнать списание для всех у кого наступила дата (ручной запуск)
    processDueBillings: () =>
        agent.post<ApiResult<number>>('/billing/process-due', {}),
};