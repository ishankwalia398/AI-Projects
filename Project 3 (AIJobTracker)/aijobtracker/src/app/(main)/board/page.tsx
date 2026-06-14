'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { JobCard } from '@/components/board/JobCard';
import { Application, STATUS_ORDER, ApplicationStatus } from '@/types';
import { createClient } from '@/utils/supabase/client';
import { updateApplicationStatus } from './actions';
import { toast } from 'sonner';

export default function BoardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setApplications(data as unknown as Application[]);
      }
      setIsLoading(false);
    }
    loadData();
  }, [supabase]);

  const columns = useMemo(() => {
    const cols: Record<ApplicationStatus, Application[]> = {
      [ApplicationStatus.Wishlist]: [],
      [ApplicationStatus.Applied]: [],
      [ApplicationStatus.FollowUp]: [],
      [ApplicationStatus.Interview]: [],
      [ApplicationStatus.Offer]: [],
      [ApplicationStatus.Rejected]: [],
    };

    applications.forEach((app) => {
      if (cols[app.status]) {
        cols[app.status].push(app);
      }
    });

    return cols;
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function onDragStart(event: DragStartEvent) {
    const { active } = event;
    const app = applications.find((a) => a.id === active.id);
    if (app) {
      setActiveApplication(app);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveApp = active.data.current?.type === 'Job';
    const isOverApp = over.data.current?.type === 'Job';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveApp) return;

    // Dropping a Job over another Job
    if (isActiveApp && isOverApp) {
      const activeAppStatus = active.data.current?.application.status;
      const overAppStatus = over.data.current?.application.status;

      if (activeAppStatus !== overAppStatus) {
        setApplications((apps) => {
          return apps.map((app) => {
            if (app.id === activeId) {
              return { ...app, status: overAppStatus };
            }
            return app;
          });
        });
      }
    }

    // Dropping a Job over a Column empty area
    if (isActiveApp && isOverColumn) {
      const activeAppStatus = active.data.current?.application.status;
      const overColumnStatus = over.data.current?.status;

      if (activeAppStatus !== overColumnStatus) {
        setApplications((apps) => {
          return apps.map((app) => {
            if (app.id === activeId) {
              return { ...app, status: overColumnStatus };
            }
            return app;
          });
        });
      }
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveApplication(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find final status after drop
    const activeApp = applications.find(a => a.id === activeId);
    if (!activeApp) return;

    const oldApp = active.data.current?.application;
    if (oldApp && oldApp.status !== activeApp.status) {
      // Optimistic update was applied during DragOver, now persist it
      try {
        const result = await updateApplicationStatus(activeApp.id, activeApp.status);
        if (result.success) {
          toast.success(`Moved to ${activeApp.status}`);
        } else {
          toast.error('Failed to update status');
          // Revert on error
          setApplications((apps) =>
            apps.map((a) => (a.id === activeId ? { ...a, status: oldApp.status } : a))
          );
        }
      } catch (e) {
        // Revert on error
        setApplications((apps) =>
          apps.map((a) => (a.id === activeId ? { ...a, status: oldApp.status } : a))
        );
      }
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading board...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kanban Board</h2>
          <p className="text-muted-foreground">Drag and drop applications to update their status.</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn 
              key={status} 
              status={status} 
              applications={columns[status]} 
            />
          ))}
        </div>

        <DragOverlay>
          {activeApplication ? <JobCard application={activeApplication} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
