import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Trend } from '../types';

export const trendKeys = {
  all: ['trends'] as const,
  top: () => [...trendKeys.all, 'top'] as const,
  byPlatform: (platform: string) => [...trendKeys.all, 'platform', platform] as const,
};

export function useTrends() {
  return useQuery({
    queryKey: trendKeys.top(),
    queryFn: async () => {
      const response = await api.get('/trends/top');
      return response.data as Trend[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - trends don't change that often
  });
}

export function useTrendsByPlatform(platform: string) {
  return useQuery({
    queryKey: trendKeys.byPlatform(platform),
    queryFn: async () => {
      const response = await api.get(`/trends/platform/${platform}`);
      return response.data as Trend[];
    },
    enabled: !!platform,
    staleTime: 5 * 60 * 1000,
  });
}
