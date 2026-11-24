import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import { base44, invalidateApiCache } from "@/api/base44Client";

/**
 * TanStack Query hook for GET /api/v1/... endpoints
 */
export function useApiV1Query(queryKey, path, options = {}) {
  const normalizedPath = path.startsWith("/v1/") ? path : `/v1${path.startsWith("/") ? path : `/${path}`}`;
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: () => apiRequest(normalizedPath),
    staleTime: 15000,
    ...options,
  });
}

/**
 * TanStack Query hook for POST /api/v1/functions/{name} RPC endpoints
 */
export function useRpcQuery(queryKey, functionName, payload = {}, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey, functionName, payload],
    queryFn: async () => {
      const res = await base44.functions.invoke(functionName, payload);
      return res?.data ?? res;
    },
    staleTime: 15000,
    ...options,
  });
}

/**
 * TanStack Query hook for entity collections (/api/v1/{entity})
 */
export function useEntityQuery(entityName, filterParams = {}, sort = "-created_date", limit = 100, options = {}) {
  return useQuery({
    queryKey: ["entity", entityName, filterParams, sort, limit],
    queryFn: () => base44.entities[entityName].filter(filterParams, sort, limit),
    staleTime: 15000,
    ...options,
  });
}

/**
 * TanStack Mutation hook for /api/v1/... mutations with automatic query & cache invalidation
 */
export function useApiV1Mutation(mutationFn, invalidateKeys = []) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (...args) => {
      invalidateApiCache();
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      });
      return args;
    },
  });
}
