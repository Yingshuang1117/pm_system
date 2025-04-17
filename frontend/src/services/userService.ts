import { api } from './api';
import { User, UserFormValues } from '../types';

export const userService = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: UserFormValues): Promise<User> => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: number, userData: Partial<UserFormValues>): Promise<User> => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  // Reset user password
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await api.post(`/api/users/${id}/reset-password`, { newPassword });
  }
}; 