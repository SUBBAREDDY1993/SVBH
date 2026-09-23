import api from './api';
import { ApiResponse, Expense, ExpenseSummary, ProfitLossReport } from '../types';

export const expenseService = {
  async getExpenses(startDate?: string, endDate?: string): Promise<Expense[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get<ApiResponse<Expense[]>>('/expenses', { params });
    return response.data.data || [];
  },

  async getExpenseSummary(): Promise<ExpenseSummary> {
    const response = await api.get<ApiResponse<ExpenseSummary>>('/expenses/summary');
    return response.data.data!;
  },

  async getProfitLossReport(year?: number): Promise<ProfitLossReport> {
    const params = year ? { year } : {};
    const response = await api.get<ApiResponse<ProfitLossReport>>('/expenses/profit-loss', { params });
    return response.data.data!;
  },

  async createExpense(expense: Partial<Expense>): Promise<Expense> {
    const response = await api.post<ApiResponse<Expense>>('/expenses', expense);
    return response.data.data!;
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    const response = await api.put<ApiResponse<Expense>>(`/expenses/${id}`, expense);
    return response.data.data!;
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/expenses/${id}`);
  },
};
