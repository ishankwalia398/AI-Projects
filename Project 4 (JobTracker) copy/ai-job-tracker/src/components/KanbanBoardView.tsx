import React, { useState } from 'react';
import { JobApplication, StatusType } from '../types';
import { Briefcase, MapPin, Calendar, Clock, AlertCircle, Plus } from 'lucide-react';

interface KanbanBoardViewProps {
  applications: JobApplication[];
  onUpdateStatus: (id: string, newStatus: StatusType) => void;
  onJobCardClick: (id: string) => void;
  onAddJobClick: (initialStatus?: StatusType) => void;
}

const COLUMNS: { status: StatusType; label: string; bgClass: string; textClass: string; dotClass: string }[] = [
  { status: 'Wishlist', label: 'Wishlist', bgClass: 'bg-[#F4F5F7]', textClass: 'text-[#42526E]', dotClass: 'bg-slate-400' },
  { status: 'Applied', label: 'Applied', bgClass: 'bg-[#F4F5F7]', textClass: 'text-[#E65100]', dotClass: 'bg-orange-500' },
  { status: 'Follow-up', label: 'Follow-up', bgClass: 'bg-[#F4F5F7]', textClass: 'text-cyan-700', dotClass: 'bg-cyan-500' },
  { status: 'Interview', label: 'Interview', bgClass: 'bg-[#F4F5F7]', textClass: 'text-[#0747A6]', dotClass: 'bg-blue-600' },
  { status: 'Offer', label: 'Offer', bgClass: 'bg-[#F4F5F7]', textClass: 'text-green-700', dotClass: 'bg-green-600' },
  { status: 'Rejected', label: 'Rejected', bgClass: 'bg-[#F4F5F7]', textClass: 'text-red-700', dotClass: 'bg-red-500' },
];

export function KanbanBoardView({ applications, onUpdateStatus, onJobCardClick, onAddJobClick }: KanbanBoardViewProps) {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<StatusType | null>(null);

  // Helper to generate initials color
  const getAvatarColor = (company: string) => {
    const code = company.charCodeAt(0) % 5;
    const presets = [
      'bg-[#E3F2FD] text-[#0747A6] border-blue-200',
      'bg-[#E8F5E9] text-green-700 border-green-200',
      'bg-violet-50 text-violet-700 border-violet-200',
      'bg-[#FFF3E0] text-orange-700 border-orange-200',
      'bg-[#FFEBEE] text-red-700 border-red-200',
    ];
    return presets[code] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAppId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setActiveDropColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: StatusType) => {
    e.preventDefault();
    if (activeDropColumn !== status) {
      setActiveDropColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusType) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      onUpdateStatus(appId, targetStatus);
    }
    handleDragEnd();
  };

  return (
    <div className="space-y-4" id="kanban-board-view">
      <div className="flex justify-between items-center pb-3 border-b border-[#DFE1E6]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D] font-sans">
            Application Pipeline
          </h1>
          <p className="text-[#5E6C84] text-xs mt-0.5">
            Drag and drop cards between status swimlanes as your interviews progress. Double-click or click to edit.
          </p>
        </div>
      </div>

      {/* Kanban grid - horizontal scrollable on low screens */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4 xl:overflow-x-visible">
        {COLUMNS.map((col) => {
          const columnJobs = applications.filter((app) => app.status === col.status);
          const isOver = activeDropColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              onDragLeave={() => setActiveDropColumn(null)}
              className={`flex flex-col rounded border p-2.5 transition-all duration-200 min-w-[210px] md:min-w-0 ${
                isOver ? 'bg-[#EBECF0] border-blue-500 border-dashed ring-2 ring-blue-100' : 'bg-[#F4F5F7] border-[#DFE1E6] premium-shadow'
              }`}
            >
              {/* Swimlane Column Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DFE1E6]">
                <div className="flex items-center gap-1.5">
                   <span className={`w-2 h-2 rounded-full ${col.dotClass}`}></span>
                  <span className="font-bold text-[#172B4D] text-xs">{col.label}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#5E6C84] bg-[#FAFBFC] px-1.5 py-0.5 rounded border border-[#DFE1E6]">
                  {columnJobs.length}
                </span>
              </div>

              {/* Add role button indicator */}
              <button
                onClick={() => onAddJobClick(col.status)}
                className="w-full py-1 mb-2 bg-white hover:bg-[#FAFBFC] border border-[#DFE1E6] rounded text-[#42526E] hover:text-[#172B4D] font-bold text-[10.5px] flex justify-center items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add role
              </button>

              {/* Cards wrapper */}
              <div className="space-y-2.5 min-h-[350px] select-none">
                {columnJobs.length === 0 ? (
                  <div className="text-center text-[#5E6C84] py-12 text-[10px] border border-dashed border-[#DFE1E6] rounded bg-white">
                    No roles tracked
                  </div>
                ) : (
                  columnJobs.map((app) => {
                    let priorityColor = 'bg-[#FAFBFC] text-[#5E6C84] border-[#DFE1E6]';
                    if (app.priority === 'Urgent') priorityColor = 'bg-[#FFEBEE] text-red-700 border-red-200';
                    else if (app.priority === 'High') priorityColor = 'bg-[#FFF3E0] text-orange-700 border-orange-200';
                    else if (app.priority === 'Medium') priorityColor = 'bg-[#E3F2FD] text-blue-700 border-blue-200';

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onJobCardClick(app.id)}
                        className="p-2.5 bg-white border border-[#DFE1E6] rounded hover:border-[#42526E] transition-all duration-150 cursor-grab active:cursor-grabbing hover:shadow-2xs group"
                      >
                        {/* Title and Avatar */}
                        <div className="flex gap-2 items-start justify-between mb-1.5">
                          <div className="grow min-w-0">
                            <h4 className="font-bold text-xs text-[#172B4D] truncate tracking-tight group-hover:text-blue-600">
                              {app.role}
                            </h4>
                            <p className="text-[10px] text-[#5E6C84] font-semibold truncate mt-0.5">
                              {app.company}
                            </p>
                          </div>
                          {/* Colored initials avatar */}
                          <div className={`w-6 h-6 shrink-0 text-[10px] font-bold rounded border flex items-center justify-center font-sans shadow-2xs ${getAvatarColor(app.company)}`}>
                            {app.company.slice(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Middle metadata metrics */}
                        <div className="space-y-1 mb-2 text-[10px] text-[#5E6C84] font-medium">
                          {app.location && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="h-2.5 w-2.5 inline shrink-0 text-[#A5ADBA]" />
                              <span className="truncate">{app.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5 shrink-0 text-[#A5ADBA]" />
                            <span>{new Date(app.appliedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Footer tags and Priority badge */}
                        <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-[#EBECF0]">
                          <span className={`px-1.5 py-0.5 text-[8.5px] font-bold border rounded uppercase tracking-wider ${priorityColor}`}>
                            {app.priority}
                          </span>
                          
                          {app.tags.length > 0 && (
                            <span className="text-[8.5px] font-mono font-bold text-[#5E6C84] bg-[#FAFBFC] px-1 py-0.5 border border-[#DFE1E6] rounded">
                              {app.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
