import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type StatusTimelineEntry } from '@/types';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

interface ApplicationTimelineProps {
  timeline: StatusTimelineEntry[];
}

export function ApplicationTimeline({ timeline }: ApplicationTimelineProps) {
  if (timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
          <CardDescription>History of status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No timeline events found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Timeline</CardTitle>
        <CardDescription>History of status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pl-4 border-l-2 border-muted relative">
          {timeline.map((entry, index) => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-primary">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{entry.status}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.changedAt && !isNaN(new Date(entry.changedAt).getTime())
                    ? format(new Date(entry.changedAt), 'MMM d, yyyy h:mm a')
                    : 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
