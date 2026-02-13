
import { GitHubProfile, GitHubRepo } from '../types';

const BASE_URL = 'https://api.github.com';

/**
 * Enhanced GitHub Service
 * Fetches profile, all repos, and attempts to grab the README for the top 3 projects
 * to provide context for the LLM audit.
 */
export async function fetchGitHubData(username: string): Promise<{ profile: GitHubProfile, repos: GitHubRepo[], topReadmes: Record<string, string> }> {
  try {
    const profileResponse = await fetch(`${BASE_URL}/users/${username}`);
    
    if (profileResponse.status === 404) throw new Error('CANDIDATE_NOT_FOUND');
    if (profileResponse.status === 403) throw new Error('RATE_LIMIT_EXCEEDED');
    if (!profileResponse.ok) throw new Error(`API_FAILURE: ${profileResponse.statusText}`);
    
    const profile: GitHubProfile = await profileResponse.json();

    // Fetch repositories
    let repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;
    
    while (page <= 3) { // Cap at 300 repos for performance
      const reposResponse = await fetch(`${BASE_URL}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=pushed`);
      if (!reposResponse.ok) break;
      const pageRepos: GitHubRepo[] = await reposResponse.json();
      if (pageRepos.length === 0) break;
      repos = [...repos, ...pageRepos];
      if (pageRepos.length < perPage) break;
      page++;
    }

    // Deep Audit: Fetch READMEs for top 3 non-fork repos
    const topReadmes: Record<string, string> = {};
    const auditTargets = repos
      .filter(r => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    await Promise.all(auditTargets.map(async (repo) => {
      try {
        const readmeResp = await fetch(`${BASE_URL}/repos/${username}/${repo.name}/readme`, {
          headers: { 'Accept': 'application/vnd.github.raw' }
        });
        if (readmeResp.ok) {
          const text = await readmeResp.text();
          topReadmes[repo.name] = text.slice(0, 2000); // Sample the first 2k chars
        }
      } catch (e) {
        console.warn(`Could not audit ${repo.name}`);
      }
    }));

    return { profile, repos, topReadmes };
  } catch (error: any) {
    console.error('GitHub Service Critical Error:', error);
    throw error;
  }
}
