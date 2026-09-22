import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/api/resumeApi";
import { queryKeys } from "./queryKeys";
import type { NormalizedApiError } from "@/api/axiosClient";

/**
 * Handles the full resume lifecycle: upload -> background parse job ->
 * poll status until parsed/failed. Backed by React Query so retries,
 * caching, and loading/error states are all handled for the caller.
 */
export function useResumeUpload() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file, setUploadProgress),
    onSuccess: (result) => {
      setJobId(result.jobId);
    },
  });

  // Poll every 2s while a job is in flight; React Query stops on unmount
  // automatically and we stop polling once status leaves "parsing".
  const statusQuery = useQuery({
    queryKey: jobId ? queryKeys.resumeStatus(jobId) : ["resume", "status", "idle"],
    queryFn: () => resumeApi.getStatus(jobId as string),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "parsed" || status === "failed") return false;
      return 2000;
    },
  });

  if (statusQuery.data?.status === "parsed") {
    queryClient.invalidateQueries({ queryKey: queryKeys.resume });
    queryClient.invalidateQueries({ queryKey: queryKeys.score });
  }

  return {
    upload: uploadMutation.mutate,
    uploadProgress,
    isUploading: uploadMutation.isPending,
    uploadError: (uploadMutation.error as NormalizedApiError | null)?.message ?? null,
    status: statusQuery.data?.status ?? null,
    isParsing: statusQuery.data?.status === "parsing" || statusQuery.data?.status === "uploaded",
    parseFailed: statusQuery.data?.status === "failed",
    isParsed: statusQuery.data?.status === "parsed",
  };
}
