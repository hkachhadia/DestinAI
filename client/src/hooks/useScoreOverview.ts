import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchScoreOverview, recomputeScore } from '@/api/scoreApi';

export const scoreOverviewKey = ['score', 'overview'] as const;

/** Powers: Career Score ring, Resume/GitHub/Coding/ATS score rings,
 * Skill Mix radar, Competency Gaps bar chart, Career Velocity timeline,
 * Sync Activity heatmap, and the quick AI recommendation card — all from
 * one query, matching the Analytics screen's single-fetch design. */
export function useScoreOverview() {
  return useQuery({
    queryKey: scoreOverviewKey,
    queryFn: fetchScoreOverview,
    staleTime: 5 * 60 * 1000, // scores don't change every render; 5 min cache
  });
}

export function useRecomputeScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recomputeScore,
    onSuccess: (data) => {
      queryClient.setQueryData(scoreOverviewKey, data);
    },
  });
}
