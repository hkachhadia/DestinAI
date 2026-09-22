import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "@/contracts/api-response.types";
import type { CPPlatform, CPProfile, ConnectCPPayload } from "@/contracts/cp.types";

export const cpApi = {
  async connect(payload: ConnectCPPayload): Promise<CPProfile> {
    const { data } = await axiosClient.post<ApiResponse<CPProfile>>("/cp/connect", payload);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async sync(platform: CPPlatform): Promise<CPProfile> {
    const { data } = await axiosClient.post<ApiResponse<CPProfile>>(`/cp/sync/${platform}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getMine(): Promise<CPProfile[]> {
    const { data } = await axiosClient.get<ApiResponse<CPProfile[]>>("/cp/me");
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async disconnect(platform: CPPlatform): Promise<void> {
    await axiosClient.delete(`/cp/${platform}`);
  },
};
