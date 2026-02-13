
import { GoogleGenAI, Type } from "@google/genai";
import { GitHubProfile, GitHubRepo, ScoringMetrics, AIEvaluation, HiringTier } from '../types';

export async function generateAIEvaluation(
  profile: GitHubProfile, 
  repos: GitHubRepo[], 
  metrics: ScoringMetrics,
  readmes: Record<string, string>
): Promise<AIEvaluation> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const repoAnalysis = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      stars: r.stargazers_count,
      readme_snippet: readmes[r.name] ? "README_ATTACHED" : "NO_README",
      has_pages: r.has_pages,
      description: r.description
    }));

  const systemInstructions = `
    You are a Lead Engineering Auditor at a Tier-1 Venture Capital firm. 
    You are auditing a developer's GitHub to decide if they are "Investment Grade".
    
    AUDIT PROTOCOL:
    1. VALIDATE: Look for 'Tutorial Hell' (dozens of 1-star repos with names like 'todo-app').
    2. BENCHMARK: Categorize the developer as: 'Academic/Student', 'Bootcamp Grad', 'Systems Engineer', 'Product Engineer', or 'Architect'.
    3. FORENSICS: If READMEs are missing or short, penalize heavily for "Technical Communication Gaps".
    4. NO FLUFF: Use terms like 'Technical Debt', 'Documentation Parity', 'Commit Velocity', and 'Social Proof'.
  `;

  const prompt = `
    AUDIT SUBJECT: ${profile.login}
    QUANTITATIVE DATA:
    - Score: ${metrics.totalScore}/100
    - Activity: ${metrics.activityLevel} (${metrics.daysSinceLastActivity} days since last push)
    - Originality: ${metrics.originalityScore}/20
    - Documentation: ${metrics.documentationScore}/15
    - Primary Stack: ${[...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 5).join(', ')}

    TOP PROJECT ANALYSIS:
    ${JSON.stringify(repoAnalysis)}

    README SAMPLES (CONTEXT):
    ${Object.entries(readmes).map(([name, content]) => `REPO: ${name}\nCONTENT: ${content.slice(0, 500)}`).join('\n---\n')}

    OUTPUT JSON OBJECT:
    {
      "tier": "ELITE | STRONG_HIRE | HIREABLE | NEEDS_IMPROVEMENT | REJECT",
      "strengths": ["string"],
      "risks": ["string"],
      "verdict": "One sentence industrial-grade summary.",
      "recommendations": ["High-impact technical tasks"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tier: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            verdict: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["tier", "strengths", "risks", "verdict", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Forensic Audit Failure:', error);
    return {
      tier: metrics.totalScore > 70 ? HiringTier.STRONG_HIRE : HiringTier.NEEDS_IMPROVEMENT,
      strengths: ['Quantitative threshold met'],
      risks: ['Qualitative audit failed (API)'],
      verdict: 'Fallback: Statistical analysis suggests viable candidate.',
      recommendations: ['Audit READMEs manually', 'Validate commit history']
    };
  }
}
