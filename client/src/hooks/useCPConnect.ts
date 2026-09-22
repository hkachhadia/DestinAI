import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cpApi } from "@/api/cpApi";
import { queryKeys } from "./queryKeys";
import type { NormalizedApiError } from "@/api/axiosClient";
import type { CPPlatform } from "@/contracts/cp.types";

export function useCPProfiles() {
  return useQuery({
    queryKey: queryKeys.cp,
    queryFn: cpApi.getMine,
  });
}

export function useConnectCP() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: { platform: CPPlatform; handle: string }) => cpApi.connect(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cp });
      queryClient.invalidateQueries({ queryKey: queryKeys.score });
    },
  });

  return {
    connect: mutation.mutate,
    isConnecting: mutation.isPending,
    error: (mutation.error as NormalizedApiError | null)?.message ?? null,
  };
}
