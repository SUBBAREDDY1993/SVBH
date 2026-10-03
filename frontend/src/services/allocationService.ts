import api from './api';
import { AllocationHistory, AllocationType, ApiResponse, BedTransferRequest, Student } from '../types';

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

  async updateAllocationType(id: string, type: AllocationType): Promise<AllocationHistory> {
    const response = await api.patch<ApiResponse<AllocationHistory>>(`/allocations/${id}/type?type=${type}`, { type });
    return response.data.data!;
  },
};

