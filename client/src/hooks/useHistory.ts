import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchHistory, deleteHistoryEntry, deleteHistoryBatch, deleteAllHistory } from '@/api/historyApi';
import { toast } from '@/components/ui/Toast';

const HISTORY_KEY = ['history'] as const;

export function useHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...HISTORY_KEY, page, limit],
    queryFn: () => fetchHistory(page, limit),
    retry: false,
    staleTime: 30_000,
  });
}

export function useDeleteHistoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHistoryEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      toast.success('Analysis deleted');
    },
    onError: () => toast.error('Failed to delete — please try again'),
  });
}

export function useDeleteHistoryBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHistoryBatch(ids),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      toast.success(`${data.deleted} analysis${data.deleted !== 1 ? 'es' : ''} deleted`);
    },
    onError: () => toast.error('Failed to delete selected items'),
  });
}

export function useDeleteAllHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAllHistory,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: HISTORY_KEY });
      toast.success(`All ${data.deletedCount} analyse${data.deletedCount !== 1 ? 's' : ''} deleted`);
    },
    onError: () => toast.error('Failed to delete history'),
  });
}
