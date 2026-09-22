import api from './api';
import { ApiResponse, Bed, BedStatus } from '../types';

export const bedService = {
  async getAllBeds(status?: BedStatus, roomNumber?: string): Promise<Bed[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (roomNumber) params.append('roomNumber', roomNumber);
    const response = await api.get<ApiResponse<Bed[]>>(`/beds?${params.toString()}`);
    return response.data.data || [];
  },

  async getBed(bedId: string): Promise<Bed> {
    const response = await api.get<ApiResponse<Bed>>(`/beds/${bedId}`);
    return response.data.data!;
  },

  async updateBedStatus(bedId: string, status: BedStatus, notes?: string): Promise<Bed> {
    const response = await api.put<ApiResponse<Bed>>(`/beds/${bedId}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`);
    return response.data.data!;
  },

  async addBedToRoom(roomNumber: string): Promise<Bed> {
    const response = await api.post<ApiResponse<Bed>>(`/beds/room/${roomNumber}`);
    return response.data.data!;
  },
};
