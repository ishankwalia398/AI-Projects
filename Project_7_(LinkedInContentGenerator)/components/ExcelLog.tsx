import React from 'react';
import { Download, FileSpreadsheet, HardDrive, Clock, ShieldCheck, User } from 'lucide-react';
import { ContentRow } from '@/lib/types';

interface ExcelLogProps {
  rows: ContentRow[];
  excelStats: {
    modifiedTime: string;
    sizeBytes: number;
  };
}

export default function ExcelLog({ rows, excelStats }: ExcelLogProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr || isoStr === 'N/A') return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* EXCEL FILE METADATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5 backdrop-blur shadow flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Name</p>
            <p className="text-sm font-bold text-white font-display">content_calendar.xlsx</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5 backdrop-blur shadow flex items-center gap-4">
          <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">File Size</p>
            <p className="text-sm font-bold text-white font-display">{formatBytes(excelStats.sizeBytes)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-5 backdrop-blur shadow flex items-center gap-4">
          <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Disk Modified Time</p>
            <p className="text-sm font-bold text-white font-display">{formatDate(excelStats.modifiedTime)}</p>
          </div>
        </div>
      </div>

      {/* DOWNLOAD AREA */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white font-display">Download Local Spreadsheet</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Download the raw Excel sheet content_calendar.xlsx directly to your local file system.
          </p>
        </div>
        <a
          href="/api/download"
          download
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download XLSX
        </a>
      </div>

      {/* RECENT OPERATIONS LOG */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-zinc-900/60 border-b border-zinc-800/80">
          <h4 className="text-sm font-bold text-white font-display">Spreadsheet Operations Log</h4>
          <p className="text-xs text-zinc-500">Chronological history of cell operations and agent mutations</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/20 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-3">Row Date</th>
                <th className="px-6 py-3">Target Topic</th>
                <th className="px-6 py-3">Action By</th>
                <th className="px-6 py-3">Last Write Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs text-zinc-300">
              {rows.map((row) => (
                <tr key={`${row.date}-log`} className="hover:bg-zinc-900/10">
                  <td className="px-6 py-3.5 font-semibold text-zinc-400">{row.date}</td>
                  <td className="px-6 py-3.5 font-bold text-zinc-200 font-display">{row.topic || '(No Topic)'}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/50 text-[11px] text-zinc-300">
                      <User className="w-3 h-3 text-zinc-500" />
                      {row.updatedBy || 'System'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-zinc-400">{formatDate(row.lastUpdated)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-zinc-500 italic">
                    No operations logged. Excel file is currently empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
