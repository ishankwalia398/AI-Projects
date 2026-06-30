import React, { useState } from 'react';
import { Copy, Check, FileText, Loader2, Eye, EyeOff } from 'lucide-react';
import { ContentRow } from '@/lib/types';

interface ContentTabsProps {
  todayRow: ContentRow | null;
}

export default function ContentTabs({ todayRow }: ContentTabsProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!todayRow) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-xl">
        <FileText className="w-12 h-12 text-zinc-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white font-display">No Content Generated Yet</h3>
        <p className="text-sm text-zinc-500 max-w-sm mt-1">
          {"Trigger the pipeline using the \"Run Pipeline Now\" button to start generating today's LinkedIn post."}
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    if (!todayRow.linkedInPost) return;
    navigator.clipboard.writeText(todayRow.linkedInPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="space-y-6">
      {/* LINKEDIN POST BOX */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900/60 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="rounded bg-blue-500/10 p-1.5 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">LinkedIn Copy</h4>
              <p className="text-xs text-zinc-500">Hook-driven technical copy (~150-200 words)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition"
              title={expanded ? 'Collapse section' : 'Expand section'}
            >
              {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {todayRow.linkedInPost && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {expanded && (
          <div className="p-6">
            {todayRow.status === 'Pending' ? (
              <div className="flex flex-col items-center py-8 text-center text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-400" />
                <p className="text-sm font-semibold text-zinc-400">Waiting for Content Writer...</p>
                <p className="text-xs text-zinc-600 mt-1">Agent 2 will begin drafting the post shortly.</p>
              </div>
            ) : todayRow.status === 'Writing' && !todayRow.linkedInPost ? (
              <div className="flex flex-col items-center py-8 text-center text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-400" />
                <p className="text-sm font-semibold text-zinc-400">Agent 2 is drafting the post...</p>
                <p className="text-xs text-zinc-600 mt-1">Generating hook-driven opinionated technical copy.</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 font-sans">
                {todayRow.linkedInPost || 'Draft is empty.'}
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}
