
export interface GitHubProfile {
  login: string;
  name: string;
  bio: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
  location?: string;
  blog?: string;
}

export interface GitHubRepo {
  name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  pushed_at: string;
  html_url: string;
  size: number;
  fork: boolean;
  has_issues: boolean;
  has_projects: boolean;
  has_pages: boolean;
}

export enum HiringTier {
  ELITE = 'Elite',
  STRONG_HIRE = 'Strong Hire',
  HIREABLE = 'Hireable',
  NEEDS_IMPROVEMENT = 'Needs Improvement',
  REJECT = 'Reject'
}

export enum ActivityLevel {
  HIGHLY_ACTIVE = 'Highly Active',
  MODERATELY_ACTIVE = 'Moderately Active',
  INACTIVE = 'Inactive'
}

export interface ScoringMetrics {
  totalScore: number;
  repoCountScore: number;
  starImpact: number;
  activityScore: number;
  diversityScore: number;
  followerSignal: number;
  documentationScore: number; // New: Recruiter heuristic
  originalityScore: number;   // New: Focus on original work vs forks
  activityLevel: ActivityLevel;
  lastCommitDate: string;
  daysSinceLastActivity: number;
  recentActivityVelocity: number;
}

export interface AIEvaluation {
  tier: HiringTier;
  strengths: string[];
  risks: string[];
  verdict: string;
  recommendations: string[];
}
