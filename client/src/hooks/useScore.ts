import { useQuery } from "@tanstack/react-query";
import { scoreApi } from "@/api/scoreApi";
import { queryKeys } from "./queryKeys";

export function useScore() {
  return useQuery({
    queryKey: queryKeys.score,
    queryFn: scoreApi.getMine,
  });
}
