import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type ActivityLogEntry } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="flex flex-col flex-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest actions across all applications</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
        ) : (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex flex-col space-y-1">
                  <div className="flex items-center text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2" />
                    {activity.action}
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    {activity.createdAt && !isNaN(new Date(activity.createdAt).getTime())
                      ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                      : 'Recently'}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
