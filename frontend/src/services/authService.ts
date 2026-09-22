import api from './api';
import { ApiResponse, AuthResponse, User } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { username, password });
    if (response.data.data) {
      localStorage.setItem('svbh_token', response.data.data.token);
      localStorage.setItem('svbh_user', JSON.stringify({
        id: response.data.data.userId,
        username: response.data.data.username,
        fullName: response.data.data.fullName,
        email: response.data.data.email,
        role: response.data.data.role,
      }));
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  logout(): void {
    localStorage.removeItem('svbh_token');
    localStorage.removeItem('svbh_user');
    window.location.href = '/login';
  },

  getStoredUser(): Partial<User> | null {
    const userStr = localStorage.getItem('svbh_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('svbh_token');
  },
};
