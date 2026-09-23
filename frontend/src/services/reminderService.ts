import api from './api';
import { ApiResponse, PaymentReminder, ReminderBatchResult } from '../types';

export const reminderService = {
  async getTodayReminders(): Promise<PaymentReminder[]> {
    const response = await api.get<ApiResponse<PaymentReminder[]>>('/reminders/today');
    return response.data.data || [];
  },

  async getStudentReminders(studentId: string): Promise<PaymentReminder[]> {
    const response = await api.get<ApiResponse<PaymentReminder[]>>(`/reminders/student/${studentId}`);
    return response.data.data || [];
  },

  async triggerBatch(slot: 'MORNING' | 'EVENING', force = false): Promise<ReminderBatchResult> {
    const response = await api.post<ApiResponse<ReminderBatchResult>>(
      `/reminders/trigger?slot=${slot}&force=${force}`
    );
    return response.data.data!;
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
};
