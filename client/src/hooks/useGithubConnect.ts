import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { githubApi } from "@/api/githubApi";
import { queryKeys } from "./queryKeys";
import type { NormalizedApiError } from "@/api/axiosClient";

export function useGithubProfile() {
  return useQuery({
    queryKey: queryKeys.github,
    queryFn: githubApi.getMine,
  });
}

export function useConnectGithub() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: githubApi.connect,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.github, profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.score });
    },
  });

  return {
    connect: mutation.mutate,
    isConnecting: mutation.isPending,
    error: (mutation.error as NormalizedApiError | null)?.message ?? null,
    isSuccess: mutation.isSuccess,
  };
}
