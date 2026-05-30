// types/finance.ts

export interface PaymentListItem {
    id: number;
    studentId: number;
    studentFullName: string;
    groupId: number;
    groupName: string;
    amount: number;
    type: 'Income' | 'Expense' | string; 
    method: 'Cash' | 'Card' | 'BankTransfer' | string; 
    date: string;
    isConfirmed: boolean;
    createdAt: string;
}

export interface CreatePaymentRequest {
    studentId: number;
    groupId: number;
    amount: number;
    type: number;   // 1 - Income, 2 - Expense
    method: number; // 1 - Cash, 2 - Card, 3 - BankTransfer
    dueDate?: string;
    note?: string;
    receipt?: File | null;
}