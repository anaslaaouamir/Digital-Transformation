import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTiers, createTier, updateTier, deleteTier } from './api';
import type { ITiers, ITiersApiParams, ITiersResponse } from './types';
import { toast } from 'sonner';

const TIERS_QUERY_KEY = 'tiers' as const;

export function useTiersQuery(params?: ITiersApiParams) {
  return useQuery<ITiersResponse, Error>({
    queryKey: [TIERS_QUERY_KEY, params],
    queryFn: () => fetchTiers(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 2,
  });
}

export function useCreateTierMutation() {
  const queryClient = useQueryClient();
  return useMutation<ITiers, Error, Partial<ITiers>>({
    mutationFn: (data) => createTier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY] });
      toast.success('Tier created successfully');
    },
    onError: (err) => toast.error(`Error creating tier: ${err.message}`),
  });
}

export function useUpdateTierMutation() {
  const queryClient = useQueryClient();
  return useMutation<ITiers, Error, { id: number; tierData: Partial<ITiers> }>({
    mutationFn: ({ id, tierData }) => updateTier(id, tierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY] });
      toast.success('Tier updated successfully');
    },
    onError: (err) => toast.error(`Error updating tier: ${err.message}`),
  });
}

export function useDeleteTierMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIERS_QUERY_KEY] });
      toast.success('Tier deleted successfully');
    },
    onError: (err) => toast.error(`Error deleting tier: ${err.message}`),
  });
}