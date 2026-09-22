import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "@/contracts/api-response.types";
import type { AuthResult, LoginPayload, SignupPayload, User } from "@/contracts/user.types";

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResult> {
    const { data } = await axiosClient.post<ApiResponse<AuthResult>>("/auth/login", payload);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async signup(payload: SignupPayload): Promise<AuthResult> {
    const { data } = await axiosClient.post<ApiResponse<AuthResult>>("/auth/signup", payload);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post("/auth/logout");
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    const { data } = await axiosClient.post<ApiResponse<AuthResult>>("/auth/refresh", { refreshToken });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await axiosClient.get<ApiResponse<User>>("/users/me");
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

};
