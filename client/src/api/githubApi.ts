import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "@/contracts/api-response.types";
import type { ConnectGithubPayload, GithubProfile } from "@/contracts/github.types";

export const githubApi = {
  async connect(payload: ConnectGithubPayload): Promise<GithubProfile> {
    const { data } = await axiosClient.post<ApiResponse<GithubProfile>>("/github/connect", payload);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async sync(): Promise<GithubProfile> {
    const { data } = await axiosClient.post<ApiResponse<GithubProfile>>("/github/sync");
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getMine(): Promise<GithubProfile | null> {
    const { data } = await axiosClient.get<ApiResponse<GithubProfile | null>>("/github/me");
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async disconnect(): Promise<void> {
    await axiosClient.delete("/github/disconnect");
  },
};
