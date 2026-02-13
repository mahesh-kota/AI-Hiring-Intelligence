
import { GitHubRepo, ScoringMetrics, ActivityLevel, GitHubProfile } from '../types';

/**
 * RECRUITER-GRADE SCORING ENGINE (v2.0)
 * 
 * Logic Overview:
 * 1. Activity Velocity (30%): Frequency and recency of pushes.
 * 2. Originality Ratio (20%): Significant penalty for profiles that are 90%+ forks.
 * 3. Technical Breadth (15%): Multi-stack proficiency and star social proof.
 * 4. Documentation Signal (15%): Proxy for "Production Readiness" (description presence, issues, pages).
 * 5. Experience Maturity (10%): Account age + follower/following ratio.
 * 6. Repo Complexity (10%): Average size and engagement per repo.
 */
export function calculateHireabilityScore(profile: GitHubProfile, repos: GitHubRepo[]): ScoringMetrics {
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);

  // Filter out forks for most metrics to ensure we score the candidate's actual work
  const originalRepos = repos.filter(r => !r.fork);
  const forkCount = repos.length - originalRepos.length;
  const originalityRatio = repos.length > 0 ? originalRepos.length / repos.length : 0;

  // 1. Activity Velocity Calculation
  let lastCommitDate = 'N/A';
  let daysSinceLastActivity = 999;
  let recentActivityVelocity = 0; // Number of unique repos touched in last 90 days
  
  if (repos.length > 0) {
    const sortedByPush = [...repos].sort((a, b) => 
      new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    );
    const lastDate = new Date(sortedByPush[0].pushed_at);
    lastCommitDate = lastDate.toISOString();
    daysSinceLastActivity = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Count "active" repos in last 90 days
    recentActivityVelocity = repos.filter(repo => new Date(repo.pushed_at) >= ninetyDaysAgo).length;
  }

  // Activity Level Logic
  const activityLevel = daysSinceLastActivity <= 7 && recentActivityVelocity >= 5 
    ? ActivityLevel.HIGHLY_ACTIVE 
    : daysSinceLastActivity <= 30 && recentActivityVelocity >= 1 
      ? ActivityLevel.MODERATELY_ACTIVE 
      : ActivityLevel.INACTIVE;

  // Base Activity Score (Max 30 points)
  // Decay factor: Activity loses value rapidly after 14 days of silence
  const recencyMultiplier = daysSinceLastActivity === 0 ? 1 : Math.max(0, 1 - (daysSinceLastActivity / 90));
  const activityScore = (Math.min(10, recentActivityVelocity) * 3) * recencyMultiplier;

  // 2. Originality Score (Max 20 points)
  const originalityScore = (originalityRatio * 20);

  // 3. Technical Breadth & Stars (Max 15 points)
  const totalStars = originalRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const languages = new Set(originalRepos.map(r => r.language).filter(Boolean));
  const starBonus = Math.min(5, (Math.log10(totalStars + 1) / 2) * 5);
  const languageBonus = Math.min(10, (languages.size / 4) * 10);
  const diversityScore = starBonus + languageBonus;

  // 4. Documentation Signal (Max 15 points)
  // Heuristic: Does the user write descriptions and use GitHub features?
  const reposWithDesc = originalRepos.filter(r => (r.description?.length || 0) > 20).length;
  const featureUsage = originalRepos.filter(r => r.has_issues || r.has_pages || r.has_projects).length;
  const docRatio = originalRepos.length > 0 ? (reposWithDesc + featureUsage) / (originalRepos.length * 2) : 0;
  const documentationScore = docRatio * 15;

  // 5. Social & Maturity (Max 10 points)
  const accountAgeYears = (now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
  const ageScore = Math.min(5, accountAgeYears);
  const followerScore = Math.min(5, (profile.followers / 100) * 5);
  const followerSignal = ageScore + followerScore;

  // 6. Complexity (Max 10 points)
  const avgSize = originalRepos.length > 0 
    ? originalRepos.reduce((sum, r) => sum + r.size, 0) / originalRepos.length 
    : 0;
  const complexityScore = Math.min(10, (Math.log10(avgSize + 1) / 5) * 10);

  const totalScore = Math.round(
    activityScore + 
    originalityScore + 
    diversityScore + 
    documentationScore + 
    followerSignal + 
    complexityScore
  );

  return {
    totalScore,
    repoCountScore: Math.round(originalityScore),
    starImpact: Math.round(starBonus),
    activityScore: Math.round(activityScore),
    diversityScore: Math.round(diversityScore),
    followerSignal: Math.round(followerSignal),
    documentationScore: Math.round(documentationScore),
    originalityScore: Math.round(originalityScore),
    activityLevel,
    lastCommitDate,
    daysSinceLastActivity,
    recentActivityVelocity
  };
}
