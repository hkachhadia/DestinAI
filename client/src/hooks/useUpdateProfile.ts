import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/api/userApi";
import { queryKeys } from "./queryKeys";
import { useAuth } from "./useAuth";
import type { NormalizedApiError } from "@/api/axiosClient";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const mutation = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(queryKeys.currentUser, user);
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: (mutation.error as NormalizedApiError | null)?.message ?? null,
  };
}
