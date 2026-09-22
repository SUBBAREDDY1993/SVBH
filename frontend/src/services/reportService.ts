import api from './api';
import { ApiResponse, CollectionReport, OccupancyReport, RevenueReport } from '../types';

export const reportService = {
  async getOccupancyReport(): Promise<OccupancyReport> {
    const response = await api.get<ApiResponse<OccupancyReport>>('/reports/occupancy');
    return response.data.data!;
  },

  async getCollectionReport(): Promise<CollectionReport> {
    const response = await api.get<ApiResponse<CollectionReport>>('/reports/collection');
    return response.data.data!;
  },

  async getRevenueReport(year?: number): Promise<RevenueReport> {
    const url = year ? `/reports/revenue?year=${year}` : '/reports/revenue';
    const response = await api.get<ApiResponse<RevenueReport>>(url);
    return response.data.data!;
  },

  downloadStudentsCsv(): void {
    window.open('/api/reports/export/students-csv', '_blank');
  },

  downloadPaymentsCsv(): void {
    window.open('/api/reports/export/payments-csv', '_blank');
  },
};
