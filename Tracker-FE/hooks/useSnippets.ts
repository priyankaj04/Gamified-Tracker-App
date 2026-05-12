import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { Snippet, SnippetCategory } from '@/types';

export const snippetKeys = {
  all: ['snippets'] as const,
  list: (params?: Record<string, unknown>) => ['snippets', 'list', params] as const,
};

interface ListParams {
  projectId?: string;
  language?: string;
  category?: SnippetCategory;
  search?: string;
  pinned?: boolean;
}

export const useSnippets = (params: ListParams = {}) =>
  useQuery({
    queryKey: snippetKeys.list(params as any),
    queryFn: () => api.get<{ data: { snippets: Snippet[] } }>('/snippets', { params }).then(unwrap),
  });

export interface SnippetBody {
  projectId?: string | null;
  title: string;
  language?: string;
  content: string;
  category?: SnippetCategory;
  tags?: string[];
}

export const useCreateSnippet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SnippetBody) => api.post<{ data: Snippet }>('/snippets', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
};

export const useUpdateSnippet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SnippetBody> }) =>
      api.put<{ data: Snippet }>(`/snippets/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
};

export const useDeleteSnippet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/snippets/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
};

export const useToggleSnippetPin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ data: Snippet }>(`/snippets/${id}/pin`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: snippetKeys.all }),
  });
};
