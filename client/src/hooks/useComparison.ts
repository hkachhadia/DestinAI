import { useQuery } from '@tanstack/react-query';
import { fetchComparison } from '@/api/comparisonApi';

export function useComparison(baseId: string | null, compareId: string | null) {
  return useQuery({
    queryKey: ['comparison', baseId, compareId],
    queryFn: () => fetchComparison(baseId!, compareId!),
    enabled: !!(baseId && compareId && baseId !== compareId),
    staleTime: 60_000,
    retry: false,
  });
}
