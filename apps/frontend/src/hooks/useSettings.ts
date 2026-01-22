import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export const settingsKeys = {
  all: ['settings'] as const,
  list: () => [...settingsKeys.all, 'list'] as const,
  detail: (key: string) => [...settingsKeys.all, 'detail', key] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data as Setting[];
    },
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: settingsKeys.detail(key),
    queryFn: async () => {
      const response = await api.get(`/settings/${key}`);
      return response.data as Setting;
    },
    enabled: !!key,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const response = await api.put(`/settings/${key}`, { value, description });
      return response.data as Setting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.list() });
    },
  });
}

export function useSaveAllSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: { key: string; value: string; description?: string }[]) => {
      const results = await Promise.all(
        settings.map((setting) =>
          api.put(`/settings/${setting.key}`, { value: setting.value, description: setting.description })
        )
      );
      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.list() });
    },
  });
}
