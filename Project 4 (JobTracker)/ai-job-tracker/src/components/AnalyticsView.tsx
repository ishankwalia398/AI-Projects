import React from 'react';
import { JobApplication } from '../types';
import { Sparkles, Calendar, TrendingUp, Compass, Award, BarChart3, HelpCircle, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';

interface AnalyticsViewProps {
  applications: JobApplication[];
}

export function AnalyticsView({ applications }: AnalyticsViewProps) {
  const total = applications.length;

  // 1. Calculate Funnel metrics
  const countWishlist = applications.filter(a => a.status === 'Wishlist').length;
  const countApplied = applications.filter(a => a.status === 'Applied').length;
  const countFollowup = applications.filter(a => a.status === 'Follow-up').length;
  const countInterview = applications.filter(a => a.status === 'Interview').length;
  const countOffer = applications.filter(a => a.status === 'Offer').length;
  const countRejected = applications.filter(a => a.status === 'Rejected').length;

  // Let's count progressive conversions
  // To reach Interview, they must have passed Applied/Wishlist
  const stageApplied = total; // everything
  const stageFollowUp = countFollowup + countInterview + countOffer + countRejected;
  const stageInterview = countInterview + countOffer + countRejected;
  const stageOffer = countOffer;

  const pctFollowup = stageApplied > 0 ? Math.round((stageFollowUp / stageApplied) * 100) : 0;
  const pctInterview = stageApplied > 0 ? Math.round((stageInterview / stageApplied) * 100) : 0;
  const pctOffer = stageApplied > 0 ? Math.round((stageOffer / stageApplied) * 100) : 0;

  // 2. Source Effectiveness (Applications count and Conversion past applied)
  const sourceStats = () => {
    const map: { [source: string]: { total: number; responded: number; interviews: number } } = {};
    
    applications.forEach(app => {
      const src = app.source || 'Other';
      if (!map[src]) {
        map[src] = { total: 0, responded: 0, interviews: 0 };
      }
      map[src].total += 1;
      if (['Follow-up', 'Interview', 'Offer', 'Rejected'].includes(app.status)) {
        map[src].responded += 1;
      }
      if (['Interview', 'Offer'].includes(app.status)) {
        map[src].interviews += 1;
      }
    });

    return Object.entries(map).map(([name, stats]) => ({
      name,
      total: stats.total,
      responded: stats.responded,
      interviews: stats.interviews,
      interviewRate: stats.total > 0 ? Math.round((stats.interviews / stats.total) * 100) : 0,
    })).sort((a,b) => b.total - a.total);
  };

  const sourcesList = sourceStats();

  // 3. Priorities Ratio
  const priorityDistribution = {
    Urgent: applications.filter(a => a.priority === 'Urgent').length,
    High: applications.filter(a => a.priority === 'High').length,
    Medium: applications.filter(a => a.priority === 'Medium').length,
    Low: applications.filter(a => a.priority === 'Low').length,
  };

  return (
    <div className="space-y-8 pb-12" id="analytics-view">
      {/* Header section */}
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
          Search Engineering & Funnels
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Review recruitment conversion rates, identify highest-yielding sources, and track active pipeline success metrics.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Col 1 & 2: Main metrics maps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Funnel chart Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-slate-400" />
              Recruitment Pipeline Conversion Funnel
            </h3>

            {total === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs">
                No pipeline data computed. Add tracked application logs to build funnel metrics.
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">1. Applications Submitted / Added</span>
                    <span className="font-mono text-slate-500">{stageApplied} jobs (100%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border border-slate-100 relative">
                    <div className="h-full bg-slate-900 w-full rounded-md flex items-center pl-3">
                      <span className="text-[10px] text-white/90 font-mono font-bold">BASE-LINE SEARCH LEVEL</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">2. Initial Client Follow-up / Active Contact</span>
                    <span className="font-mono text-slate-500">{stageFollowUp} jobs ({pctFollowup}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border border-slate-100 relative">
                    <div 
                      className="h-full bg-sky-600 rounded-md flex items-center pl-3 transition-all duration-300"
                      style={{ width: `${pctFollowup || 5}%` }}
                    >
                      {pctFollowup > 10 && <span className="text-[10px] text-white/90 font-mono font-bold">OUTREACH FREQUENCY</span>}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">3. Scheduled Virtual or Live Interviews</span>
                    <span className="font-mono text-slate-500">{stageInterview} jobs ({pctInterview}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border border-slate-100 relative">
                    <div 
                      className="h-full bg-emerald-600 rounded-md flex items-center pl-3 transition-all duration-300"
                      style={{ width: `${pctInterview || 5}%` }}
                    >
                      {pctInterview > 10 && <span className="text-[10px] text-white/90 font-mono font-bold font-semibold uppercase">Interview Yield Rate</span>}
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">4. Written Written Offers Collected</span>
                    <span className="font-mono text-slate-800 font-bold">{stageOffer} offers ({pctOffer}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden border border-slate-100 relative">
                    <div 
                      className="h-full bg-amber-500 rounded-md flex items-center pl-3 transition-all duration-300"
                      style={{ width: `${pctOffer || 5}%` }}
                    >
                      {pctOffer > 5 && <span className="text-[10px] text-zinc-950 font-mono font-bold">FINAL DEALS INKED</span>}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Sourcing Channel Efficiency Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-slate-400" />
              Sourcing Channel Yield Analysis (Efficiency Table)
            </h3>

            {sourcesList.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs">No active listing channels recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-600 font-sans">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3">Sourcing Channel</th>
                      <th className="p-3 text-center">Applications Total</th>
                      <th className="p-3 text-center">Interview Invites</th>
                      <th className="p-3 text-right">Interview Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sourcesList.map((src) => {
                      let barColor = 'bg-slate-900';
                      if (src.interviewRate >= 45) barColor = 'bg-emerald-500';
                      else if (src.interviewRate >= 20) barColor = 'bg-sky-500';

                      return (
                        <tr key={src.name} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{src.name}</td>
                          <td className="p-3 text-center font-semibold font-mono">{src.total}</td>
                          <td className="p-3 text-center font-semibold font-mono text-emerald-600">{src.interviews}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full ${barColor} rounded-full`}
                                  style={{ width: `${src.interviewRate}%` }}
                                ></div>
                              </div>
                              <span className="font-mono font-bold text-slate-800 w-10 text-right">{src.interviewRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Priority distribution ratio, Resume analyzers */}
        <div className="space-y-8">
          
          {/* Priorities Ratio Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Pipeline Priority Load</h3>
            
            <div className="space-y-4">
              {Object.entries(priorityDistribution).map(([prio, count]) => {
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                let colorClass = 'bg-slate-400';
                if (prio === 'Urgent') colorClass = 'bg-red-500';
                else if (prio === 'High') colorClass = 'bg-orange-500';
                else if (prio === 'Medium') colorClass = 'bg-blue-500';

                return (
                  <div key={prio} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">{prio} Priority</span>
                      <span className="font-mono text-slate-500">{count} jobs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full ${colorClass} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Resume tips tracker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1">
              <Award className="h-4 w-4 text-emerald-500" />
              ATS Yield Tips
            </h3>
            
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-medium">
              <div className="flex gap-2 items-start">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span>Include high-fidelity markdown tags directly on job descriptions to auto-feed keywords into Gemini resume matching checks.</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span>Referral channels yield a <span className="text-slate-950 font-bold underline underline-offset-2">5.5x higher</span> interview invitation conversion than pure blind submissions.</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span>Track priority indicators. Focus outbound efforts on jobs tagged as **Urgent/High** for rapid turnaround.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
