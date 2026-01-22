import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface AnalyticsOverview {
  totalPosts: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  platformStats: {
    platform: string;
    posts: number;
    engagement: number;
  }[];
}

interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  platform?: string;
}

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: () => [...analyticsKeys.all, 'overview'] as const,
  byPlatform: (platform: string) => [...analyticsKeys.all, 'platform', platform] as const,
  history: (params: AnalyticsParams) => [...analyticsKeys.all, 'history', params] as const,
};

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data as AnalyticsOverview;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAnalyticsByPlatform(platform: string) {
  return useQuery({
    queryKey: analyticsKeys.byPlatform(platform),
    queryFn: async () => {
      const response = await api.get(`/analytics/platform/${platform}`);
      return response.data;
    },
    enabled: !!platform,
  });
}

export function useAnalyticsHistory(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.history(params),
    queryFn: async () => {
      const response = await api.get('/analytics/history', { params });
      return response.data;
    },
  });
}
