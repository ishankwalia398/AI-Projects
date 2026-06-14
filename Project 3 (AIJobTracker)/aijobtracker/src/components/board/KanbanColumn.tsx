'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Application, ApplicationStatus, STATUS_COLORS } from '@/types';
import { JobCard } from './JobCard';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
}

export function KanbanColumn({ status, applications }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const columnColor = STATUS_COLORS[status];

  return (
    <div className="flex h-full min-w-[300px] flex-col rounded-lg bg-muted/50 p-3">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: columnColor }} 
          />
          <h2 className="font-semibold text-sm">{status}</h2>
        </div>
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground shadow-sm">
          {applications.length}
        </div>
      </div>

      <div 
        ref={setNodeRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-[150px] p-1"
      >
        <SortableContext
          items={applications.map((app) => app.id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <JobCard key={app.id} application={app} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
