import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import type {
  Project,
  ProjectStatus,
  ProjectType,
  Priority,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters?: Record<string, unknown>) => ['projects', 'list', filters] as const,
  detail: (id: string) => ['projects', id] as const,
  portfolio: ['projects', 'portfolio'] as const,
  tags: ['projects', 'tags'] as const,
};

interface ProjectFilters {
  status?: ProjectStatus;
  type?: ProjectType;
  priority?: Priority;
  archived?: boolean;
  pinned?: boolean;
  search?: string;
  tag?: string;
}

export const useProjects = (filters: ProjectFilters = {}) =>
  useQuery({
    queryKey: projectKeys.list(filters as any),
    queryFn: () =>
      api
        .get<{ data: { projects: Project[] } }>('/projects', { params: filters })
        .then(unwrap),
  });

export const useProject = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: Project }>(`/projects/${id}`).then(unwrap),
  });

export interface ProjectCreateBody {
  name: string;
  description?: string | null;
  type?: ProjectType;
  priority?: Priority;
  techStack?: string[];
  coverEmoji?: string;
  coverColor?: string;
  startDate?: string;
  targetShipDate?: string | null;
  estimatedHours?: number | null;
  githubUrl?: string | null;
  demoUrl?: string | null;
  figmaUrl?: string | null;
  docsUrl?: string | null;
  milestones?: { title: string; targetDate?: string | null }[];
}

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProjectCreateBody) =>
      api.post<{ data: { project: Project } & XpAwardResult }>('/projects', body).then(unwrap),
    onSuccess: (res) => {
      celebrate({ xp: res.xpEarned, label: 'Project Created', level: 'big' });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useUpdateProject = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ProjectCreateBody> & {
      status?: ProjectStatus;
      stars?: number | null;
      readmeNotes?: string | null;
      isPortfolio?: boolean;
    }) => api.put<{ data: Project }>(`/projects/${id}`, body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useTogglePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ data: Project }>(`/projects/${id}/pin`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
};

export const useToggleArchive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ data: Project }>(`/projects/${id}/archive`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
};

export const useShipProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: { project: Project } & XpAwardResult }>(`/projects/${id}/ship`).then(unwrap),
    onSuccess: (res) => {
      celebrate({ xp: res.xpEarned, label: 'Project Shipped 🚀', level: 'epic' });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useDuplicateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: Project }>(`/projects/${id}/duplicate`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
};

export const usePortfolio = () =>
  useQuery({
    queryKey: projectKeys.portfolio,
    queryFn: () => api.get<{ data: { projects: Project[] } }>('/projects/portfolio').then(unwrap),
  });

export const useProjectTags = () =>
  useQuery({
    queryKey: projectKeys.tags,
    queryFn: () =>
      api.get<{ data: { tags: { id: string; name: string; color: string }[] } }>('/projects/tags').then(unwrap),
  });

