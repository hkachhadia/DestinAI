import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, updateSettings } from '@/api/settingsApi';
import type { NormalizedApiError } from '@/api/axiosClient';

const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data);
    },
  });

  return {
    saveSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
    error: (mutation.error as NormalizedApiError | null)?.message ?? null,
  };
}
