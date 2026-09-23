import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  triggerAnalysis,
  type TriggerAnalysisPayload,
  type TriggerAnalysisResponse,
} from '@/api/analysisApi';

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<TriggerAnalysisResponse, Error, TriggerAnalysisPayload | undefined>({
    mutationFn: (payload?: TriggerAnalysisPayload) =>
      triggerAnalysis(payload),

    onSuccess: (analysis) => {
      // Invalidate all data that depends on a new analysis.
      queryClient.invalidateQueries({
        queryKey: ['score', 'overview'],
      });

      queryClient.invalidateQueries({
        queryKey: ['score'],
      });

      queryClient.invalidateQueries({
        queryKey: ['ai', 'career-report'],
      });

      queryClient.invalidateQueries({
        queryKey: ['ai', 'interview-prep'],
      });

      queryClient.invalidateQueries({
        queryKey: ['history'],
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      });

      // The exact analysis ID is now available to the caller
      // through mutation.data.
      //
      // AI generation is intentionally NOT started here.
      // The component that initiated the analysis will start
      // Gemini generation using this exact ID.
      console.info(
        '[ANALYSIS] Deterministic analysis completed:',
        analysis._id,
      );
    },
  });
}