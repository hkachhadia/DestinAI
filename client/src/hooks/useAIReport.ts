import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLatestAIReport, refreshAIInsights, fetchInterviewPrep } from '@/api/aiApi';

const AI_REPORT_KEY = ['ai', 'career-report'] as const;
const INTERVIEW_KEY = ['ai', 'interview-prep'] as const;

export function useAIReport() {
  return useQuery({
    queryKey: AI_REPORT_KEY,
    queryFn: fetchLatestAIReport,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/** CHANGE 2: Only refreshes the AI narrative — does NOT re-run the full analysis */
export function useRefreshAIInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshAIInsights,
    onSuccess: () => {
      // Invalidate and force refetch from server so the new insight is loaded.
      // Do NOT use setQueryData with the mutation response — the response from
      // /insights/refresh contains the raw server shape; let the GET endpoint
      // return the properly mapped AICareerReport shape instead.
      queryClient.invalidateQueries({ queryKey: AI_REPORT_KEY });
      queryClient.invalidateQueries({ queryKey: INTERVIEW_KEY });
    },
  });
}

export function useInterviewPrep() {
  return useQuery({
    queryKey: INTERVIEW_KEY,
    queryFn: fetchInterviewPrep,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
