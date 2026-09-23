import api from './api';
import { ApiResponse, HostelSetting } from '../types';

export const settingService = {
  async getSettings(): Promise<HostelSetting> {
    const response = await api.get<ApiResponse<HostelSetting>>('/settings');
    return response.data.data!;
  },

  async updateSettings(settings: HostelSetting): Promise<HostelSetting> {
    const response = await api.put<ApiResponse<HostelSetting>>('/settings', settings);
    return response.data.data!;
  },

  async resetDemoData(): Promise<void> {
    await api.post<ApiResponse<void>>('/settings/reset-demo');
  },

  async clearDemoData(): Promise<void> {
    await api.post<ApiResponse<void>>('/settings/clear-demo');
  },
};
