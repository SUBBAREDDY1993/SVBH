import api from './api';
import { ApiResponse, Room } from '../types';

export const roomService = {
  async getAllRooms(includeBeds = true): Promise<Room[]> {
    const response = await api.get<ApiResponse<Room[]>>(`/rooms?includeBeds=${includeBeds}`);
    return response.data.data || [];
  },

  async getRoom(roomNumber: string): Promise<Room> {
    const response = await api.get<ApiResponse<Room>>(`/rooms/${roomNumber}`);
    return response.data.data!;
  },

  async createRoom(room: Partial<Room>): Promise<Room> {
    const response = await api.post<ApiResponse<Room>>('/rooms', room);
    return response.data.data!;
  },

  async updateRoom(id: string, room: Partial<Room>): Promise<Room> {
    const response = await api.put<ApiResponse<Room>>(`/rooms/${id}`, room);
    return response.data.data!;
  },

  async deleteRoom(id: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/rooms/${id}`);
  },
};
