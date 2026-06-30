'use client';

import React, { useState, useEffect } from 'react';
import { Play, Calendar, FileText, FileSpreadsheet, Key, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { ContentRow, PipelineStatus } from '@/lib/types';
import StatusCards from '@/components/StatusCards';
import ContentTabs from '@/components/ContentTabs';
import CalendarTable from '@/components/CalendarTable';
import ExcelLog from '@/components/ExcelLog';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'log'>('today');
  const [todayRow, setTodayRow] = useState<ContentRow | null>(null);
  const [calendarRows, setCalendarRows] = useState<ContentRow[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [triggering, setTriggering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Poll state function
  const fetchStatusAndToday = async () => {
    try {
      const resStatus = await fetch('/api/status');
      const dataStatus = await resStatus.json();
      setStatus(dataStatus);

      const resToday = await fetch('/api/today');
      const dataToday = await resToday.json();
      setTodayRow(dataToday);

      const resCal = await fetch('/api/calendar');
      const dataCal = await resCal.json();
      setCalendarRows(dataCal);

      setErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setErrorMsg('Lost connection to Next.js API server.');
    }
  };

  // Initial fetch and set interval
  useEffect(() => {
    fetchStatusAndToday();
    const interval = setInterval(fetchStatusAndToday, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerPipeline = async () => {
    if (status?.isRunning) return;
    setTriggering(true);
    try {
      const res = await fetch('/api/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Run request failed');
      }
      // Instantly refresh state
      fetchStatusAndToday();
    } catch (err: any) {
      alert(`Error starting pipeline: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  // Safe formatting for date
  const formatScheduledTime = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const isRunning = status?.isRunning || false;
  const currentStep = status?.currentStep || 'Idle';
  const apiKeyHealth = status?.apiKeyHealth || { groq: false, gemini: false };
  const excelStats = status?.excelFile || { modifiedTime: 'N/A', sizeBytes: 0 };
  const lastUpdated = todayRow?.lastUpdated || status?.lastRunTime || 'N/A';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0A0A0B] text-zinc-100 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 border-r border-zinc-800/80 bg-zinc-950/40 p-6 flex flex-col justify-between backdrop-blur-xl">
        <div className="space-y-8">
          {/* APP LOGO */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white font-display">ContentForge</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Local Vibe Pipeline</p>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="space-y-3">
            <button
              onClick={triggerPipeline}
              disabled={isRunning || triggering}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 duration-150 ${
                isRunning
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-500/20 border border-indigo-500/30'
              }`}
            >
              {isRunning || triggering ? (
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
              ) : (
                <Play className="w-4 h-4 fill-current text-white" />
              )}
              {isRunning ? 'Running Agent Steps...' : 'Run Pipeline Now'}
            </button>

            {isRunning && (
              <div className="px-3 py-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center">
                <span className="text-[11px] text-indigo-400 font-bold animate-pulse">{currentStep}</span>
              </div>
            )}
          </div>

          {/* CRON RUN INDICATOR */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Next Scheduled Run
            </div>
            <p className="mt-2 text-sm font-bold text-zinc-200">
              {formatScheduledTime(status?.nextRunTime)}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Daily at 09:00 AM local time</p>
          </div>
        </div>

        {/* API KEY HEALTH MONITOR */}
        <div className="mt-8 border-t border-zinc-800/80 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Key className="w-3.5 h-3.5" />
            API Key Health
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-900">
              <span className="text-xs font-semibold text-zinc-400">Groq SDK (Llama 3)</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${apiKeyHealth.groq ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-rose-500 shadow-lg shadow-rose-500/40'}`} />
                <span className="text-[10px] font-bold text-zinc-500">{apiKeyHealth.groq ? 'ACTIVE' : 'ERROR'}</span>
              </div>
            </div>


          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* Connection warning */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}

        {/* Upper Status Cards */}
        <StatusCards
          todayRow={todayRow}
          pipelineRunning={isRunning}
          currentStep={currentStep}
          lastUpdated={lastUpdated}
        />

        {/* Tab switcher */}
        <div className="border-b border-zinc-800/80">
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-tight border-b-2 transition ${
                activeTab === 'today'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              {"Today's Content"}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-tight border-b-2 transition ${
                activeTab === 'calendar'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar Table
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`flex items-center gap-2 pb-4 text-sm font-bold tracking-tight border-b-2 transition ${
                activeTab === 'log'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel Operations Log
            </button>
          </div>
        </div>

        {/* Dynamic tabs render */}
        <div className="pt-2">
          {activeTab === 'today' && <ContentTabs todayRow={todayRow} />}
          {activeTab === 'calendar' && <CalendarTable rows={calendarRows} />}
          {activeTab === 'log' && <ExcelLog rows={calendarRows} excelStats={excelStats} />}
        </div>
      </main>
    </div>
  );
}
