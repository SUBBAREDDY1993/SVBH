import api from './api';
import { ApiResponse, Payment, PaymentDue, PaymentRequest, PaymentStatus } from '../types';

export const paymentService = {
  async getPayments(studentId?: string, status?: PaymentStatus): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (studentId) params.append('studentId', studentId);
    if (status) params.append('status', status);
    const response = await api.get<ApiResponse<Payment[]>>(`/payments?${params.toString()}`);
    return response.data.data || [];
  },

  async getReceipt(receiptNumber: string): Promise<Payment> {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${receiptNumber}`);
    return response.data.data!;
  },

  async recordPayment(data: PaymentRequest): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/payments', data);
    return response.data.data!;
  },

  async getOverdue(): Promise<PaymentDue[]> {
    const response = await api.get<ApiResponse<PaymentDue[]>>('/payments/overdue');
    return response.data.data || [];
  },

  async getDueSoon(): Promise<PaymentDue[]> {
    const response = await api.get<ApiResponse<PaymentDue[]>>('/payments/due-soon');
    return response.data.data || [];
  },

  async getDueToday(): Promise<PaymentDue[]> {
    const response = await api.get<ApiResponse<PaymentDue[]>>('/payments/due-today');
    return response.data.data || [];
  },
};
