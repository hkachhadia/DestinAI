import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerAnalysis, type TriggerAnalysisPayload } from '@/api/analysisApi';

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: TriggerAnalysisPayload) => triggerAnalysis(payload),
    onSuccess: () => {
      // Invalidate all data that depends on a new analysis
      queryClient.invalidateQueries({ queryKey: ['score', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['score'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'career-report'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'interview-prep'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
