'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Application, PRIORITY_COLORS } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JobCardProps {
  application: Application;
}

export function JobCard({ application }: JobCardProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id, data: { type: 'Job', application } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Generate initials for avatar
  const initials = application.company
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Pick a random background color based on company name length/chars
  const avatarBgColor = `hsl(${(application.company.length * 20) % 360}, 70%, 40%)`;

  const priorityColor = PRIORITY_COLORS[application.priority];

  const appliedDate = application.appliedDate ? new Date(application.appliedDate) : new Date();
  const isValidDate = !isNaN(appliedDate.getTime());
  const isFollowUpDue = 
    application.status === 'Applied' && 
    isValidDate &&
    isPast(new Date(appliedDate.getTime() + 7 * 24 * 60 * 60 * 1000));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing mb-3 touch-none"
      onClick={() => router.push(`/applications/${application.id}`)}
    >
      <Card className="hover:border-primary/50 transition-colors bg-card shadow-sm">
        <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div 
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white font-bold text-xs"
              style={{ backgroundColor: avatarBgColor }}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-sm truncate">{application.company}</h3>
              <p className="text-xs text-muted-foreground truncate">{application.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" style={{ borderColor: priorityColor, color: priorityColor }} className="text-[10px] px-1.5 py-0">
              {application.priority}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {application.updatedAt && !isNaN(new Date(application.updatedAt).getTime())
                ? formatDistanceToNow(new Date(application.updatedAt), { addSuffix: true })
                : 'Recently'}
            </span>
          </div>
          
          {isFollowUpDue && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-sm w-fit">
              <Clock className="w-3 h-3" />
              Follow-up Due
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
