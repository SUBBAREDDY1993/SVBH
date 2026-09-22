import api from './api';
import {
  ApiResponse,
  NoticePeriodRequest,
  Student,
  StudentAdmissionRequest,
  StudentStatus,
  StudentUpdateRequest,
  VacateStudentRequest,
} from '../types';

export const studentService = {
  async getAllStudents(status?: StudentStatus, search?: string): Promise<Student[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const response = await api.get<ApiResponse<Student[]>>(`/students?${params.toString()}`);
    return response.data.data || [];
  },

  async getStudent(id: string): Promise<Student> {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data!;
  },

  async admitStudent(data: StudentAdmissionRequest): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data.data!;
  },

  async updateStudent(id: string, data: StudentUpdateRequest): Promise<Student> {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data.data!;
  },

  async markNoticePeriod(id: string, data: NoticePeriodRequest): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>(`/students/${id}/notice`, data);
    return response.data.data!;
  },

  async vacateStudent(id: string, data: VacateStudentRequest): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>(`/students/${id}/vacate`, data);
    return response.data.data!;
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/students/${id}`);
  },
};
