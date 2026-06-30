import React from 'react';
import { Sparkles, Activity, Clock, CheckCircle2, AlertCircle, Edit3, Image as ImageIcon } from 'lucide-react';
import { ContentRow } from '@/lib/types';

interface StatusCardsProps {
  todayRow: ContentRow | null;
  pipelineRunning: boolean;
  currentStep: string;
  lastUpdated: string;
}

export default function StatusCards({ todayRow, pipelineRunning, currentStep, lastUpdated }: StatusCardsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30';
      case 'Writing':
        return 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30';
      case 'Imaging':
        return 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30';
      case 'Done':
        return 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30';
      case 'Error':
        return 'from-rose-500/20 to-red-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'from-zinc-500/10 to-zinc-700/10 text-zinc-400 border-zinc-700/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 animate-pulse" />;
      case 'Writing':
        return <Edit3 className="w-5 h-5 animate-pulse" />;
      case 'Imaging':
        return <ImageIcon className="w-5 h-5 animate-pulse" />;
      case 'Done':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'Error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr || isoStr === 'N/A') return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* CARD 1: TODAY'S TOPIC */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl shadow-2xl transition duration-300 hover:border-zinc-700">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{"Today's Topic"}</p>
            <h3 className="mt-2 text-lg font-bold tracking-tight text-white line-clamp-2 leading-snug font-display">
              {todayRow ? todayRow.topic : 'No topic generated yet'}
            </h3>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        {todayRow && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
              {todayRow.date}
            </span>
          </div>
        )}
      </div>

      {/* CARD 2: PIPELINE STATUS */}
      <div className={`relative overflow-hidden rounded-2xl border bg-zinc-900/50 p-6 backdrop-blur-xl shadow-2xl transition duration-300 ${todayRow ? getStatusColor(todayRow.status) : 'border-zinc-800/80 text-zinc-400'}`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{"Today's Status"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight font-display">
                {todayRow ? todayRow.status : 'Idle'}
              </span>
            </div>
            {pipelineRunning && (
              <p className="mt-1 text-xs text-zinc-400 animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                {currentStep}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-zinc-800/80 p-2 border border-zinc-700/50">
            {todayRow ? getStatusIcon(todayRow.status) : <Activity className="w-5 h-5" />}
          </div>
        </div>
        {todayRow && todayRow.errorLog && (
          <div className="mt-3 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg line-clamp-1">
            {todayRow.errorLog}
          </div>
        )}
      </div>

      {/* CARD 3: TIMING LOGS */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl shadow-2xl transition duration-300 hover:border-zinc-700">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Last Updated</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white font-display">
              {formatDate(lastUpdated)}
            </h3>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 text-xs text-zinc-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          Updated by: <span className="text-zinc-400 font-semibold">{todayRow?.updatedBy || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
