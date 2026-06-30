import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock, Edit3, Image as ImageIcon } from 'lucide-react';
import { ContentRow } from '@/lib/types';

interface CalendarTableProps {
  rows: ContentRow[];
}

export default function CalendarTable({ rows }: CalendarTableProps) {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    let classes = '';
    let icon = null;

    switch (status) {
      case 'Pending':
        classes = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        icon = <Clock className="w-3 h-3" />;
        break;
      case 'Writing':
        classes = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        icon = <Edit3 className="w-3 h-3" />;
        break;
      case 'Imaging':
        classes = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        icon = <ImageIcon className="w-3 h-3" />;
        break;
      case 'Done':
        classes = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        icon = <CheckCircle2 className="w-3 h-3" />;
        break;
      case 'Error':
        classes = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        icon = <AlertCircle className="w-3 h-3" />;
        break;
      default:
        classes = 'bg-zinc-800 text-zinc-400 border-zinc-700/50';
        icon = <Clock className="w-3 h-3" />;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${classes}`}>
        {icon}
        {status}
      </span>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-xl">
        <Calendar className="w-12 h-12 text-zinc-600 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white font-display">Spreadsheet is Empty</h3>
        <p className="text-sm text-zinc-500 max-w-sm mt-1">
          No records found in content_calendar.xlsx. Once you run the pipeline, the sheet will populate here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 border-b border-zinc-800/80 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Topic</th>
              <th className="px-6 py-4">LinkedIn Post</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">LinkedIn Image</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
            {rows.map((row) => {
              const imageCount = row.linkedInImage ? row.linkedInImage.split(',').filter(Boolean).length : 0;
              return (
                <tr key={row.date} className="hover:bg-zinc-900/20 transition duration-150">
                  {/* Date Column */}
                  <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                    {row.date}
                  </td>
                  {/* Topic Column */}
                  <td className="px-6 py-4 font-bold text-zinc-100 max-w-xs truncate font-display">
                    {row.topic}
                  </td>
                  {/* Post Content Column */}
                  <td className="px-6 py-4 max-w-md">
                    {row.linkedInPost ? (
                      <div>
                        <p className="line-clamp-2 text-zinc-400 text-xs leading-relaxed">
                          {row.linkedInPost}
                        </p>
                        <button
                          onClick={() => setSelectedPost(row.linkedInPost)}
                          className="mt-1 text-[11px] text-blue-400 hover:text-blue-300 font-bold transition"
                        >
                          View Full Post
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 italic text-xs">No copy generated yet</span>
                    )}
                  </td>
                  {/* Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(row.status)}
                  </td>
                  {/* Image Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-400">
                    {imageCount > 0 ? (
                      <span className="flex items-center gap-1 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50 w-fit">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                        {imageCount} {imageCount === 1 ? 'Image' : 'Images'}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FULL POST MODAL DIALOG */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 font-display">LinkedIn Post Copy</h3>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-850">
              {selectedPost}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedPost);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Copy Text
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
