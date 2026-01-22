import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Feed } from '../types';

// Query keys factory
export const feedKeys = {
  all: ['feeds'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: () => [...feedKeys.lists()] as const,
  details: () => [...feedKeys.all, 'detail'] as const,
  detail: (id: string) => [...feedKeys.details(), id] as const,
};

// Fetch all feeds
export function useFeeds() {
  return useQuery({
    queryKey: feedKeys.list(),
    queryFn: async () => {
      const response = await api.get('/feeds');
      return response.data as Feed[];
    },
  });
}

// Fetch single feed
export function useFeed(id: string) {
  return useQuery({
    queryKey: feedKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/feeds/${id}`);
      return response.data as Feed;
    },
    enabled: !!id,
  });
}

// Create feed mutation
export function useCreateFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Feed>) => {
      const response = await api.post('/feeds', data);
      return response.data as Feed;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// Update feed mutation
export function useUpdateFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Feed> }) => {
      const response = await api.put(`/feeds/${id}`, data);
      return response.data as Feed;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
      queryClient.setQueryData(feedKeys.detail(data.id), data);
    },
  });
}

// Delete feed mutation
export function useDeleteFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/feeds/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}

// Fetch feed content manually
export function useFetchFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/feeds/${id}/fetch`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.lists() });
    },
  });
}
