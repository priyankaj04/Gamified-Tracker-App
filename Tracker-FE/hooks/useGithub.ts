import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { projectKeys } from './useProjects';

export interface GithubRepoStats {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  pushedAt: string | null;
  htmlUrl: string;
  isPrivate: boolean;
  error?: string;
}

export const useGithubRepo = (url: string | undefined) =>
  useQuery({
    enabled: !!url,
    queryKey: ['github', 'repo', url],
    queryFn: () =>
      api.get<{ data: GithubRepoStats | null }>('/github/repo', { params: { url } }).then(unwrap),
  });

export const useGithubCommits = (url: string | undefined, limit = 30) =>
  useQuery({
    enabled: !!url,
    queryKey: ['github', 'commits', url, limit],
    queryFn: () =>
      api
        .get<{
          data: {
            commitCount: number;
            lastCommit: { sha: string; message: string | null; author: string | null; date: string | null } | null;
            commits: { sha: string; message: string | null; author: string | null; date: string | null }[];
            error?: string;
          } | null;
        }>('/github/commits', { params: { url, limit } })
        .then(unwrap),
  });

export const useSyncProjectGithub = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .patch<{ data: { cached: boolean; data: GithubRepoStats | null; error?: string } }>(
          `/projects/${projectId}/github-sync`,
        )
        .then(unwrap),
    onSuccess: (_d, projectId) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};
