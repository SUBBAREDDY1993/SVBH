import api from './api';
import { AdminDueAlert, ApiResponse, FeeReminder, IncomingReplyResponse, PaymentReminder, ReminderBatchResult, ReminderCounts } from '../types';

export const reminderService = {
  async getActiveReminders(): Promise<FeeReminder[]> {
    const response = await api.get<ApiResponse<FeeReminder[]>>('/reminders');
    return response.data.data || [];
  },

  async getReminderCounts(): Promise<ReminderCounts> {
    const response = await api.get<ApiResponse<ReminderCounts>>('/reminders/counts');
    return response.data.data || { upcomingFees: 0, dueToday: 0, overdue: 0, paid: 0, totalActive: 0 };
  },

  async getTodayReminders(): Promise<PaymentReminder[]> {
    const response = await api.get<ApiResponse<PaymentReminder[]>>('/reminders/today');
    return response.data.data || [];
  },

  async getStudentReminders(studentId: string): Promise<PaymentReminder[]> {
    const response = await api.get<ApiResponse<PaymentReminder[]>>(`/reminders/student/${studentId}`);
    return response.data.data || [];
  },

  async sendStudentReminder(studentId: string, slot = 'MANUAL', force = false): Promise<PaymentReminder> {
    const response = await api.post<ApiResponse<PaymentReminder>>(
      `/reminders/${studentId}/send?slot=${slot}&force=${force}`
    );
    return response.data.data!;
  },

  async retryStudentReminder(studentId: string): Promise<PaymentReminder> {
    const response = await api.post<ApiResponse<PaymentReminder>>(`/reminders/${studentId}/retry`);
    return response.data.data!;
  },

  async triggerBatch(slot: 'MORNING' | 'EVENING' | 'NIGHT' | 'ALL', force = false, includeSkipped = false): Promise<ReminderBatchResult> {
    const response = await api.post<ApiResponse<ReminderBatchResult>>(
      `/reminders/trigger?slot=${slot}&force=${force}&includeSkipped=${includeSkipped}`
    );
    return response.data.data!;
  },

  async sendSkippedReminders(slot = 'ALL'): Promise<ReminderBatchResult> {
    const response = await api.post<ApiResponse<ReminderBatchResult>>(`/reminders/send-skipped?slot=${slot}`);
    return response.data.data!;
  },

  async markAllAsSent(slot = 'ALL'): Promise<ReminderBatchResult> {
    const response = await api.post<ApiResponse<ReminderBatchResult>>(`/reminders/mark-all-sent?slot=${slot}`);
    return response.data.data!;
  },


  async syncMonthlyDues(): Promise<number> {
    const response = await api.post<ApiResponse<number>>('/students/sync-monthly-dues');
    return response.data.data || 0;
  },

  async resetToday(slot?: string): Promise<void> {
    const params = new URLSearchParams();
    if (slot) params.append('slot', slot);
    await api.post(`/reminders/reset-today?${params.toString()}`);
  },

  async recordManualReminder(
    studentId: string,
    channel: 'WHATSAPP' | 'SMS' | 'CALL',
    customMessage?: string
  ): Promise<PaymentReminder> {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    params.append('channel', channel);
    if (customMessage) {
      params.append('customMessage', customMessage);
    }
    const response = await api.post<ApiResponse<PaymentReminder>>(`/reminders/record?${params.toString()}`);
    return response.data.data!;
  },

  async simulateIncomingReply(data: {
    studentId?: string;
    mobileNumber: string;
    messageText: string;
    senderName?: string;
    channel?: string;
  }): Promise<IncomingReplyResponse> {
    const response = await api.post<ApiResponse<IncomingReplyResponse>>('/reminders/reply', data);
    return response.data.data!;
  },

  async getIncomingReplies(): Promise<PaymentReminder[]> {
    const response = await api.get<ApiResponse<PaymentReminder[]>>('/reminders/replies');
    return response.data.data || [];
  },

  async getAdminDueAlert(): Promise<AdminDueAlert> {
    const response = await api.get<ApiResponse<AdminDueAlert>>('/reminders/admin-alert');
    return response.data.data!;
  },

  async sendAdminDueAlert(force = false): Promise<AdminDueAlert> {
    const response = await api.post<ApiResponse<AdminDueAlert>>(`/reminders/admin-alert/send?force=${force}`);
    return response.data.data!;
  },
};
