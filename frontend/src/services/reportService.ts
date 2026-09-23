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

  async downloadStudentsCsv(): Promise<void> {
    try {
      const response = await api.get('/reports/export/students-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export students CSV:', error);
    }
  },

  async downloadPaymentsCsv(): Promise<void> {
    try {
      const response = await api.get('/reports/export/payments-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export payments CSV:', error);
    }
  },
};
