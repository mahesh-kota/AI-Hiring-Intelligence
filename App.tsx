
import React, { useState, useEffect } from 'react';
import { fetchGitHubData } from './services/githubService';
import { calculateHireabilityScore } from './services/scoringEngine';
import { generateAIEvaluation } from './services/geminiService';
import { GitHubProfile, GitHubRepo, ScoringMetrics, AIEvaluation, HiringTier, ActivityLevel } from './types';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    profile: GitHubProfile;
    repos: GitHubRepo[];
    metrics: ScoringMetrics;
    aiEval: AIEvaluation;
  } | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), `> ${msg}`]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setLogs(['Initializing Audit Engine v4.0.1...']);

    try {
      addLog(`Connecting to GitHub API for @${username}...`);
      const { profile, repos, topReadmes } = await fetchGitHubData(username);
      
      addLog(`Processing ${repos.length} repositories...`);
      const metrics = calculateHireabilityScore(profile, repos);
      
      addLog(`Identifying high-value project READMEs...`);
      addLog(`Feeding Forensic Engine with ${Object.keys(topReadmes).length} README samples...`);
      
      const aiEval = await generateAIEvaluation(profile, repos, metrics, topReadmes);
      
      addLog(`Audit Complete. Generating Verdict.`);
      setData({ profile, repos, metrics, aiEval });
    } catch (err: any) {
      setError(err.message || 'Audit Interrupted: Unexpected Hardware/API Exception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e6edf3] font-mono selection:bg-indigo-500 selection:text-white p-4 md:p-8">
      {/* HUD Header */}
      <header className="max-w-6xl mx-auto mb-10 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="bg-white text-black px-2 py-0.5">AUDIT</span>
            <span>PORTFOLIO_OS</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] mt-1 uppercase">Proprietary Recruitment Intelligence</p>
        </div>
        
        <form onSubmit={handleAnalyze} className="flex gap-1 w-full md:w-auto">
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="GITHUB_HANDLE"
            className="bg-[#0d1117] border border-slate-700 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none w-full md:w-64 uppercase"
            disabled={loading}
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-6 py-2 uppercase tracking-widest transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'EXECUTING...' : 'RUN_AUDIT'}
          </button>
        </form>
      </header>

      {/* Real-time Audit Logs */}
      {loading && (
        <div className="max-w-xl mx-auto mb-10 p-4 border border-indigo-900 bg-indigo-950/20 rounded">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-indigo-400 uppercase animate-pulse">Live Analysis Feed</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          </div>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-[10px] text-indigo-300 font-mono truncate">{log}</div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-xl mx-auto p-4 border border-red-900 bg-red-950/20 text-red-400 text-[10px] font-bold uppercase mb-10">
          [CRITICAL_FAILURE]: {error}
        </div>
      )}

      {data && (
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-700">
          
          {/* Dashboard Left (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#0d1117] border border-slate-800 p-6 rounded-sm relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              </div>
              <img src={data.profile.avatar_url} alt="CANDIDATE" className="w-full grayscale border border-slate-800 mb-6" />
              <h2 className="text-lg font-black uppercase truncate">{data.profile.name || data.profile.login}</h2>
              <p className="text-indigo-400 text-[10px] font-bold mb-4">ID: {data.profile.login.toUpperCase()}</p>
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <MetricProgress label="Activity" current={data.metrics.activityScore} max={30} />
                <MetricProgress label="Originality" current={data.metrics.originalityScore} max={20} />
                <MetricProgress label="Docs" current={data.metrics.documentationScore} max={15} />
                <MetricProgress label="Complexity" current={data.metrics.totalScore - 65 > 0 ? 10 : 5} max={10} />
              </div>
            </div>

            <div className="bg-[#0d1117] border border-slate-800 p-4 rounded-sm">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Tech Stack Radar</h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(data.repos.map(r => r.language).filter(Boolean))].slice(0, 10).map(lang => (
                  <span key={lang} className="text-[9px] font-bold border border-slate-700 px-2 py-1 uppercase hover:bg-slate-800 cursor-default">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Center Audit Findings (6 cols) */}
          <div className="lg:col-span-6 space-y-8">
            {/* The Big Number */}
            <div className="bg-white text-black p-8 rounded-sm flex items-end justify-between overflow-hidden relative">
              <div className="absolute -bottom-8 -left-8 opacity-5">
                 <span className="text-[200px] font-black leading-none">A</span>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 opacity-60">Hireability_Index</p>
                <h1 className="text-9xl font-black tracking-tighter leading-none italic">{data.metrics.totalScore}</h1>
              </div>
              <div className="relative z-10 text-right">
                <div className="text-xs font-black uppercase mb-1">Tier_Assignment</div>
                <div className="text-2xl font-black bg-black text-white px-4 py-1 skew-x-[-10deg]">
                  {data.aiEval.tier.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* AI Auditor Verdict */}
            <div className="bg-[#0d1117] border border-slate-800 p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-indigo-500"></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Forensic Auditor Verdict</h3>
              </div>
              <p className="text-xl font-medium leading-relaxed mb-10 text-slate-200">
                "{data.aiEval.verdict}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 border-b border-emerald-900/30 pb-1">Verified Assets</h4>
                  <ul className="space-y-4">
                    {data.aiEval.strengths.map((s, i) => (
                      <li key={i} className="text-[11px] leading-snug flex gap-3">
                        <span className="text-emerald-500 font-bold">0{i+1}</span>
                        <span className="uppercase">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 border-b border-red-900/30 pb-1">Risk Factors</h4>
                  <ul className="space-y-4">
                    {data.aiEval.risks.map((r, i) => (
                      <li key={i} className="text-[11px] leading-snug flex gap-3">
                        <span className="text-red-500 font-bold">XX</span>
                        <span className="uppercase">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Improvement Terminal */}
            <div className="bg-[#0d1117] border-l-4 border-indigo-600 p-8 shadow-2xl">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Remediation Sequence</h3>
              <div className="grid grid-cols-1 gap-4">
                {data.aiEval.recommendations.map((rec, i) => (
                  <div key={i} className="group bg-[#161b22] p-4 border border-slate-800 hover:border-indigo-500 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-bold text-indigo-400 uppercase">Step_0{i+1}</span>
                       <span className="text-[9px] text-slate-600 font-mono">FIX_PRIORITY_HIGH</span>
                    </div>
                    <p className="text-xs font-bold uppercase leading-tight group-hover:text-indigo-400 transition-colors">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Feeds (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
             <div className="bg-[#0d1117] border border-slate-800 p-4">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Activity_Pulse</h3>
                <div className="text-center py-4">
                   <div className="text-5xl font-black mb-1">{data.metrics.daysSinceLastActivity}D</div>
                   <div className="text-[9px] font-bold text-slate-500 uppercase">Days since commit</div>
                </div>
                <div className="mt-4 space-y-3">
                   <div className="flex justify-between text-[9px] font-bold uppercase">
                      <span className="text-slate-500">Status</span>
                      <span className={data.metrics.daysSinceLastActivity < 14 ? 'text-green-500' : 'text-amber-500'}>
                         {data.metrics.activityLevel}
                      </span>
                   </div>
                   <div className="w-full h-1 bg-slate-800">
                      <div className="h-full bg-indigo-500" style={{width: `${Math.max(5, 100 - (data.metrics.daysSinceLastActivity/60 * 100))}%`}}></div>
                   </div>
                </div>
             </div>

             <div className="bg-[#0d1117] border border-slate-800 p-4">
                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Audit_Subjects</h3>
                <div className="space-y-6">
                  {data.repos.filter(r => !r.fork).slice(0, 5).map(repo => (
                    <div key={repo.name} className="border-l border-slate-800 pl-3">
                      <div className="text-[10px] font-black uppercase truncate">{repo.name}</div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-bold text-amber-500">★ {repo.stargazers_count}</span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase">{repo.language || 'DATA'}</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </main>
      )}

      <footer className="max-w-7xl mx-auto mt-20 pt-10 border-t border-slate-800 text-center">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em]">
          End_of_Transmission // Portofolio.OS System v4.0.1
        </p>
      </footer>
    </div>
  );
};

const MetricProgress: React.FC<{ label: string, current: number, max: number }> = ({ label, current, max }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-tighter">
      <span>{label}</span>
      <span>{current}/{max}</span>
    </div>
    <div className="w-full bg-[#161b22] h-1">
      <div className="bg-indigo-600 h-full transition-all duration-1000" style={{width: `${(current/max)*100}%`}}></div>
    </div>
  </div>
);

export default App;
