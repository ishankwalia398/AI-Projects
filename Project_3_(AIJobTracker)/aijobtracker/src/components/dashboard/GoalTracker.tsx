import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GoalTrackerProps {
  currentApps: number;
  monthlyGoal: number;
}

export function GoalTracker({ currentApps, monthlyGoal }: GoalTrackerProps) {
  const percentage = Math.min(Math.round((currentApps / monthlyGoal) * 100), 100);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between">
          <span>Monthly Goal</span>
          <span className="text-primary">{percentage}%</span>
        </CardTitle>
        <CardDescription>Applications submitted this month</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-3 w-full" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{currentApps} completed</span>
          <span>{monthlyGoal} goal</span>
        </div>
      </CardContent>
    </Card>
  );
}
