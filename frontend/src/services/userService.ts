import axios from 'axios';
import { User, UserFormValues } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const userService = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: UserFormValues): Promise<User> => {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: number, userData: Partial<UserFormValues>): Promise<User> => {
    const response = await axios.put(`${API_URL}/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/users/${id}`);
  },

  // Reset user password
  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await axios.post(`${API_URL}/users/${id}/reset-password`, { newPassword });
  }
}; 