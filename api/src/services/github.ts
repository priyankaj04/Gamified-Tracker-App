import { supabase } from './supabase';

const parseRepo = (url: string): { owner: string; repo: string } | null => {
  if (!url) return null;
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
};

const fetchJson = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KaizenArc-Forge', Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<any>;
};

export const getRepoStats = async (url: string) => {
  const parsed = parseRepo(url);
  if (!parsed) throw new Error('Invalid GitHub URL');
  const repo = await fetchJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
  return {
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    language: repo.language,
    pushedAt: repo.pushed_at,
    htmlUrl: repo.html_url,
    isPrivate: !!repo.private,
  };
};

export const getRecentCommits = async (url: string, limit = 30) => {
  const parsed = parseRepo(url);
  if (!parsed) throw new Error('Invalid GitHub URL');
  const commits: any[] = await fetchJson(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=${limit}`,
  );
  return {
    commitCount: commits.length,
    lastCommit: commits[0]
      ? {
          sha: commits[0].sha,
          message: commits[0].commit?.message ?? null,
          author: commits[0].commit?.author?.name ?? null,
          date: commits[0].commit?.author?.date ?? null,
        }
      : null,
    commits: commits.slice(0, limit).map((c) => ({
      sha: c.sha,
      message: c.commit?.message ?? null,
      author: c.commit?.author?.name ?? null,
      date: c.commit?.author?.date ?? null,
    })),
  };
};

// Sync GitHub data to a project (returns cached if synced <30 min ago)
export const syncProjectGithub = async (projectId: string) => {
  const sb = supabase();
  const { data: p, error } = await sb.from('projects').select('*').eq('id', projectId).single();
  if (error) throw error;
  if (!p.github_url) throw new Error('No GitHub URL set on project');

  const cached = p.github_synced_at && Date.now() - new Date(p.github_synced_at).getTime() < 30 * 60 * 1000;
  if (cached && p.github_data) return { cached: true, data: p.github_data };

  try {
    const stats = await getRepoStats(p.github_url);
    let commitCount = 0;
    let lastCommit: any = null;
    try {
      const c = await getRecentCommits(p.github_url, 30);
      commitCount = c.commitCount;
      lastCommit = c.lastCommit;
    } catch {
      /* ignore commit failures */
    }
    const payload = { ...stats, commitCount, lastCommit };
    await sb
      .from('projects')
      .update({ github_data: payload, github_synced_at: new Date().toISOString() })
      .eq('id', projectId);
    return { cached: false, data: payload };
  } catch (e: any) {
    return { cached: false, data: null, error: e.message };
  }
};
