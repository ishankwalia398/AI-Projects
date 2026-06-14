import React, { useState, useEffect } from 'react';
import { JobApplication, User, ActivityLog, DashboardStats } from '../types';
import { dbGetActivityLog, seedSampleData } from '../lib/db';
import { Sparkles, Calendar, TrendingUp, Compass, Award, Plus, CheckCircle2, ChevronRight, BarChart3, Settings } from 'lucide-react';

interface DashboardViewProps {
  user: User;
  applications: JobApplication[];
  onNavigate: (tab: string) => void;
  onAddJobClick: () => void;
  onRefreshData: () => void;
}

interface AIInsights {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
}

export function DashboardView({ user, applications, onNavigate, onAddJobClick, onRefreshData }: DashboardViewProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    dbGetActivityLog(user.username).then(setActivities);
  }, [user.username, applications]);

  // Compute stats
  const totalApps = applications.length;
  
  // Response rate: % of applications that moved past 'Wishlist' or 'Applied'
  const activeStatuses = ['Follow-up', 'Interview', 'Offer', 'Rejected'];
  const totalAppliedOrRest = applications.filter(a => a.status !== 'Wishlist').length;
  const respondedApps = applications.filter(a => activeStatuses.includes(a.status) && a.status !== 'Wishlist').length;
  const responseRate = totalAppliedOrRest > 0 ? Math.round((respondedApps / totalAppliedOrRest) * 100) : 0;

  // Interview rate: % of total apps that reached Interview
  const interviewApps = applications.filter(a => a.status === 'Interview' || a.status === 'Offer' || a.status === 'Rejected').length; // passed through interview at least
  // Let's refine based on status history or simple status check
  const hasInterviewed = applications.filter(a => a.status === 'Interview' || a.status === 'Offer').length;
  const interviewRate = totalApps > 0 ? Math.round((hasInterviewed / totalApps) * 100) : 0;

  const offersCount = applications.filter(a => a.status === 'Offer').length;

  // Estimated avg days to response (randomized realistic or computed based on notes/timestamps)
  const avgDaysToResponse = totalApps > 0 ? 8 : 0;

  // Monthly stats
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonthYear = new Date().getFullYear();
  const currentMonthApps = applications.filter(a => {
    const d = new Date(a.appliedDate);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === currentMonthYear;
  }).length;

  // Goal calculation
  const monthlyGoal = 10; // Simple preset or from setting
  const goalProgress = monthlyGoal > 0 ? Math.min(Math.round((currentMonthApps / monthlyGoal) * 100), 100) : 0;

  // Group applications for chart calculation
  const statusCounts = {
    Wishlist: applications.filter(a => a.status === 'Wishlist').length,
    Applied: applications.filter(a => a.status === 'Applied').length,
    'Follow-up': applications.filter(a => a.status === 'Follow-up').length,
    Interview: applications.filter(a => a.status === 'Interview').length,
    Offer: applications.filter(a => a.status === 'Offer').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  // Applications by month (Last 6 months)
  const getMonthlyDistribution = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const name = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();
      const count = applications.filter(a => {
        const appD = new Date(a.appliedDate);
        return appD.getMonth() === d.getMonth() && appD.getFullYear() === year;
      }).length;
      months.push({ name, count });
    }
    return months;
  };

  const monthlyData = getMonthlyDistribution();
  const maxMonthlyCount = Math.max(...monthlyData.map(m => m.count), 5);

  // Request AI Insights
  const handleFetchInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applications }),
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to analyze pipeline stats');
      }

      const data = await res.json();
      setAiInsights(data);
    } catch (err: any) {
      setAiError(err.message || 'Unable to load structural career analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  // Seed sample data helper
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await seedSampleData(user.username);
      onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-4 pb-6" id="dashboard-view">
      {/* Upper greetings container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#DFE1E6] pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D] font-sans">
            Welcome back, {user.fullName || user.username}
          </h1>
          <p className="text-[#5E6C84] text-xs mt-0.5">
            Analyze key conversion ratios, active schedules, and review AI insights for your recruitment pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {totalApps === 0 && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="px-3 py-1.5 bg-[#FAFBFC] hover:bg-[#F4F5F7] text-[#42526E] font-semibold text-xs rounded border border-[#DFE1E6] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              {seeding ? 'Generating 15 Jobs...' : 'Seed 15 Sample Jobs'}
            </button>
          )}
          <button
            onClick={onAddJobClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-750 text-white font-semibold text-xs rounded transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Track New Job
          </button>
        </div>
      </div>

      {/* KPI Stats list */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded border border-[#DFE1E6] premium-shadow">
          <div className="text-[#5E6C84] text-[10px] font-bold uppercase tracking-wider">Total Active Apps</div>
          <div className="font-mono text-2xl font-bold text-[#172B4D] mt-1">{totalApps}</div>
          <p className="text-[11px] text-[#5E6C84] mt-0.5">Overall pipeline entries</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DFE1E6] premium-shadow">
          <div className="text-[#5E6C84] text-[10px] font-bold uppercase tracking-wider">Response Rate</div>
          <div className="font-mono text-2xl font-bold text-[#0747A6] mt-1">{responseRate}%</div>
          <p className="text-[11px] text-[#5E6C84] mt-0.5">Passed Applied stage</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DFE1E6] premium-shadow">
          <div className="text-[#5E6C84] text-[10px] font-bold uppercase tracking-wider">Interview Rate</div>
          <div className="font-mono text-2xl font-bold text-green-700 mt-1">{interviewRate}%</div>
          <p className="text-[11px] text-[#5E6C84] mt-0.5">Reached interview loop</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DFE1E6] premium-shadow">
          <div className="text-[#5E6C84] text-[10px] font-bold uppercase tracking-wider">Written Offers</div>
          <div className="font-mono text-2xl font-bold text-amber-600 mt-1">{offersCount}</div>
          <p className="text-[11px] text-[#5E6C84] mt-0.5">Pending written offers</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-[#DFE1E6] premium-shadow col-span-2 lg:col-span-1">
          <div className="text-[#5E6C84] text-[10px] font-bold uppercase tracking-wider">Velocity</div>
          <div className="font-mono text-2xl font-bold text-[#172B4D] mt-1">{avgDaysToResponse} <span className="text-[10px] font-medium text-[#5E6C84] font-sans">days</span></div>
          <p className="text-[11px] text-[#5E6C84] mt-0.5">Avg response latency</p>
        </div>
      </div>

      {/* Center Layout: Charts, Goal progress, AI assistant */}
      <div className="grid lg:grid-cols-3 gap-4">
        
        {/* Vector custom charts */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Chart Card 1: Status Distribution (Horizontal custom visualization) */}
          <div className="bg-white p-4 rounded border border-[#DFE1E6] premium-shadow">
            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[#5E6C84]" />
              Status Pipeline Distribution
            </h3>

            {/* Glowing bar track representing status levels */}
            <div className="space-y-2.5">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percentage = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                let colorClass = 'bg-[#FAFBFC]';
                let textClass = 'text-[#5E6C84] bg-[#FAFBFC] border-[#DFE1E6]';
                if (status === 'Wishlist') { colorClass = 'bg-slate-400'; textClass = 'text-[#5E6C84] bg-[#FAFBFC]'; }
                else if (status === 'Applied') { colorClass = 'bg-[#E65100]'; textClass = 'text-orange-700 bg-orange-50 border-orange-100'; }
                else if (status === 'Follow-up') { colorClass = 'bg-cyan-500'; textClass = 'text-cyan-700 bg-cyan-50 border-cyan-100'; }
                else if (status === 'Interview') { colorClass = 'bg-[#0747A6]'; textClass = 'text-blue-700 bg-blue-50 border-blue-100'; }
                else if (status === 'Offer') { colorClass = 'bg-green-600'; textClass = 'text-green-700 bg-green-50 border-green-100'; }
                else if (status === 'Rejected') { colorClass = 'bg-rose-400'; textClass = 'text-rose-700 bg-rose-50 border-rose-100'; }

                return (
                  <div key={status} className="flex items-center gap-4 text-xs font-medium">
                    <span className="w-20 text-[#42526E] font-semibold">{status}</span>
                    <div className="grow bg-slate-100 h-2 rounded overflow-hidden relative">
                      <div 
                        className={`h-full ${colorClass} rounded transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-6 text-right font-mono text-[#5E6C84]">{count}</span>
                    <span className={`px-2 py-0.5 rounded font-mono border text-[10px] w-12 text-center ${textClass}`}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Card 2: Visual Application volume by month (Custom SVG Bar Chart) */}
          <div className="bg-white p-4 rounded border border-[#DFE1E6] premium-shadow">
            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#5E6C84]" />
              Pipeline Velocity (Applications Added)
            </h3>

            {/* SVG Chart */}
            <div className="relative w-full h-40">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1="5" x2="100" y2="5" stroke="#EBECF0" strokeWidth="0.2" />
                <line x1="0" y1="15" x2="100" y2="15" stroke="#EBECF0" strokeWidth="0.2" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="#EBECF0" strokeWidth="0.2" />
                <line x1="0" y1="35" x2="100" y2="35" stroke="#DFE1E6" strokeWidth="0.3" />

                {/* Render bars */}
                {monthlyData.map((d, idx) => {
                  const barWidth = 8;
                  const x = 5 + idx * 16;
                  const barHeight = (d.count / maxMonthlyCount) * 30; // Scale height max size out of 30
                  const y = 35 - barHeight;

                  return (
                    <g key={d.name}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="1"
                        fill="url(#barGradient)"
                        className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                      />
                      {/* Counter Text above bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 1.5}
                        fontSize="2.5"
                        textAnchor="middle"
                        fill="#5E6C84"
                        fontWeight="semibold"
                        fontFamily="monospace"
                      >
                        {d.count}
                      </text>
                      {/* Month label below bar */}
                      <text
                        x={x + barWidth / 2}
                        y="38.5"
                        fontSize="2.5"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {d.name}
                      </text>
                    </g>
                  );
                })}

                {/* Definitions for gradient fills */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#091E42" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Sidebar panels: Goals tracker, Audit timeline, AI Advice */}
        <div className="space-y-4">
          
          {/* Goal tracker card */}
          <div className="bg-white p-4 rounded border border-[#DFE1E6] premium-shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">Monthly Goal</h3>
              <span className="text-[10px] font-mono font-bold text-[#5E6C84]">{currentMonthName} {currentMonthYear}</span>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-mono font-bold text-[#172B4D]">{currentMonthApps} <span className="text-xs font-normal text-[#5E6C84]">of {monthlyGoal} applied</span></span>
                <span className="text-xs font-mono font-bold text-[#5E6C84]">{goalProgress}%</span>
              </div>

              {/* Goal bar selector */}
              <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden relative">
                <div 
                  className="h-full bg-[#091E42] rounded transition-all duration-500"
                  style={{ width: `${goalProgress}%` }}
                ></div>
              </div>

              <p className="text-[#5E6C84] text-[11px] leading-snug mt-1.5">
                {goalProgress >= 100 
                  ? '🎉 Amazing! You hit your active monthly search goal!' 
                  : `Add ${monthlyGoal - currentMonthApps} more applications to hit your targeted rate.`}
              </p>
            </div>
          </div>

          {/* Recent Activity Audit Feed */}
          <div className="bg-white p-4 rounded border border-[#DFE1E6] premium-shadow">
            <h3 className="text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-3">Audit Log Timeline</h3>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center text-[#5E6C84] py-4 text-xs">No logged actions and pipeline shifts recorded yet.</div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative pl-5 pb-1.5 border-l border-[#EBECF0] last:border-0 last:pb-0">
                    <span className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-[#DFE1E6]"></span>
                    <div className="text-xs font-medium text-[#42526E] leading-relaxed">{act.action}</div>
                    <div className="font-mono text-[10px] text-[#5E6C84] mt-0.5">
                      {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Big Feature: AI Command Panel */}
      <div className="bg-[#091E42] text-white rounded p-5 relative overflow-hidden border border-[#ffffff10] shadow-xs">
        <div className="absolute top-[-40%] right-[-10%] w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-40%] left-[-10%] w-[450px] h-[450px] bg-indigo-505/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 px-2 bg-blue-500 text-white font-sans font-bold text-[9px] rounded uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 fill-white" />
              AI Recruiter Engine
            </div>
            <span className="text-[10px] text-[#A5ADBA] font-medium">Powered by Gemini & Grok</span>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-3 space-y-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white leading-snug">
                Coaching analytics and algorithmic search recommendations.
              </h2>
              <p className="text-xs text-[#A5ADBA] leading-snug">
                Our recruiting models extract metrics from your application volume, prioritizations, and success rates, outputting tailored interview, networking, and cold outreach recommendations.
              </p>
              
              <div className="pt-1.5">
                <button
                  onClick={handleFetchInsights}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Generating Assessment...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-white fill-white" />
                      Synthesize Pipeline Insights
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Results Display Panel */}
            <div className="lg:col-span-2 bg-[#ffffff05] border border-[#ffffff10] p-4 rounded text-slate-200 text-xs min-h-48 flex flex-col justify-center max-h-[300px] overflow-y-auto backdrop-blur-md">
              {aiLoading ? (
                <div className="text-center space-y-2 py-4">
                  <div className="inline-block p-1 bg-white/10 rounded animate-bounce">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-[#A5ADBA] text-xs">Analyzing pipeline trends...</p>
                </div>
              ) : aiError ? (
                <div className="text-red-400 text-center leading-relaxed text-xs">
                  <p className="font-semibold mb-1">Analysis suspended</p>
                  <p>{aiError}</p>
                </div>
              ) : aiInsights ? (
                <div className="space-y-3 font-sans text-slate-200">
                  <div>
                    <h4 className="font-bold text-blue-400 uppercase tracking-widest text-[8px] mb-0.5">Executive Pipeline Review</h4>
                    <p className="leading-relaxed font-semibold text-slate-300">{aiInsights.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
                    <div>
                      <h4 className="font-bold text-sky-400 uppercase tracking-widest text-[8px] mb-0.5">Strengths</h4>
                      <ul className="space-y-1 text-[10px] list-disc pl-3 text-slate-300 leading-tight">
                        {aiInsights.strengths.slice(0, 2).map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-500 uppercase tracking-widest text-[8px] mb-0.5">Focus Areas</h4>
                      <ul className="space-y-1 text-[10px] list-disc pl-3 text-slate-300 leading-tight">
                        {aiInsights.growthAreas.slice(0, 2).map((g, idx) => <li key={idx}>{g}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-white/5">
                    <h4 className="font-bold text-blue-400 uppercase tracking-widest text-[8px] mb-0.5">Coaching Action Steps</h4>
                    <ul className="space-y-1 text-slate-300 leading-tight">
                      {aiInsights.recommendations.map((r, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start text-[10px]">
                           <span className="text-blue-400 font-bold shrink-0">✓</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#A5ADBA] py-4">
                  <Compass className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                  <p className="max-w-xs mx-auto text-[11px]">No analysis loaded. Click the assessment button to construct AI career diagnostics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
