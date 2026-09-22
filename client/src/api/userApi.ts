import { axiosClient } from './axiosClient';
import type { ApiResponse } from '@/contracts/api-response.types';
import type { UpdateProfilePayload, User } from '@/contracts/user.types';

export const userApi = {
  async getMe(): Promise<User> {
    const { data } = await axiosClient.get<ApiResponse<User>>('/users/me');
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await axiosClient.patch<ApiResponse<User>>('/users/me', payload);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async deleteAccount(password?: string): Promise<void> {
    await axiosClient.delete('/users/me', { data: { password } });
  },
};
