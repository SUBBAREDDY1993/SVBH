import api from './api';
import { AllocationHistory, ApiResponse, BedTransferRequest, Student } from '../types';

export const allocationService = {
  async transferBed(studentId: string, data: BedTransferRequest): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>(`/allocations/transfer/${studentId}`, data);
    return response.data.data!;
  },

  async getAllocations(studentId?: string): Promise<AllocationHistory[]> {
    const url = studentId ? `/allocations?studentId=${studentId}` : '/allocations';
    const response = await api.get<ApiResponse<AllocationHistory[]>>(url);
    return response.data.data || [];
  },
};
