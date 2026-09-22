import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "@/contracts/api-response.types";
import type { Resume, ResumeStatusResult, ResumeUploadResult } from "@/contracts/resume.types";

export const resumeApi = {
  async upload(file: File, onProgress?: (percent: number) => void): Promise<ResumeUploadResult> {
    const formData = new FormData();
    formData.append("resume", file);

    const { data } = await axiosClient.post<ApiResponse<ResumeUploadResult>>(
      "/resumes/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    );
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getStatus(jobId: string): Promise<ResumeStatusResult> {
    const { data } = await axiosClient.get<ApiResponse<ResumeStatusResult>>(
      `/resumes/status/${jobId}`
    );
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getMine(): Promise<Resume | null> {
    const { data } = await axiosClient.get<ApiResponse<Resume | null>>("/resumes/me");
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
