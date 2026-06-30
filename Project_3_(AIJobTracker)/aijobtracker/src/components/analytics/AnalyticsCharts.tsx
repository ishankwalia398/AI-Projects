'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Application } from '@/types';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';

interface AnalyticsChartsProps {
  applications: Application[];
}

export function AnalyticsCharts({ applications }: AnalyticsChartsProps) {
  // Process Data for "Applications Over Time" (Last 6 months)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      monthKey: format(d, 'yyyy-MM'),
      monthName: format(d, 'MMM yyyy'),
      count: 0
    };
  });

  applications.forEach(app => {
    if (!app.appliedDate || isNaN(new Date(app.appliedDate).getTime())) return;
    try {
      const appMonth = format(parseISO(app.appliedDate), 'yyyy-MM');
      const monthData = last6Months.find(m => m.monthKey === appMonth);
      if (monthData) {
        monthData.count++;
      }
    } catch(e) {}
  });

  // Process Data for "Applications by Source"
  const sourceCounts: Record<string, number> = {};
  applications.forEach(app => {
    const source = app.source || 'Unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const sourceData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Application Volume</CardTitle>
          <CardDescription>Number of applications submitted over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last6Months}>
              <XAxis dataKey="monthName" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'var(--muted)' }} 
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Sources</CardTitle>
          <CardDescription>Where you are finding your opportunities</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {sourceData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No source data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
