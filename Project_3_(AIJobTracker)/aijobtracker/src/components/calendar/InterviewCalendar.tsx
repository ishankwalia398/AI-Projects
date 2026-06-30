'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, Phone, Video } from 'lucide-react';
import Link from 'next/link';

// We define a joined type since we fetch applications with interviews
export type InterviewWithApp = {
  id: string;
  date: string;
  time: string;
  round: string;
  mode: string;
  interviewer?: string;
  link?: string;
  application_id: string;
  applications: {
    company: string;
    role: string;
  };
};

interface InterviewCalendarProps {
  interviews: InterviewWithApp[];
}

export function InterviewCalendar({ interviews }: InterviewCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const getIcon = (mode: string) => {
    if (mode === 'Video') return <Video className="h-4 w-4" />;
    if (mode === 'Phone') return <Phone className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  // Find interviews for selected date
  const selectedInterviews = date 
    ? interviews.filter(i => isSameDay(new Date(i.date), date))
    : [];

  // Find upcoming interviews (from today onwards, sorted)
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcomingInterviews = interviews
    .filter(i => new Date(i.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); // Show next 5

  // Dates that have interviews for the calendar modifier
  const interviewDates = interviews
    .filter(i => i.date && !isNaN(new Date(i.date).getTime()))
    .map(i => new Date(i.date));

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Select a date to view scheduled interviews</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow-sm"
            modifiers={{
              interview: interviewDates,
            }}
            modifiersStyles={{
              interview: { fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'underline' }
            }}
          />
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, 'MMMM d, yyyy') : 'Selected Date'}
            </CardTitle>
            <CardDescription>Interviews scheduled for this day</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews scheduled on this date.</p>
            ) : (
              <div className="space-y-4">
                {selectedInterviews.map(interview => (
                  <div key={interview.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/applications/${interview.application_id}`} className="font-semibold hover:underline">
                          {interview.applications?.company || 'Unknown Company'}
                        </Link>
                        <Badge variant="outline">{interview.round}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{interview.applications?.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {interview.time}</span>
                        <span className="flex items-center gap-1">{getIcon(interview.mode)} {interview.mode}</span>
                      </div>
                    </div>
                    {interview.link && (
                      <a href={interview.link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                        Join
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
            <CardDescription>Your next 5 scheduled interviews</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming interviews.</p>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map(interview => (
                  <div key={interview.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center bg-muted rounded-md p-2 w-16 h-16">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {interview.date && !isNaN(new Date(interview.date).getTime()) ? format(new Date(interview.date), 'MMM') : '-'}
                        </span>
                        <span className="text-xl font-bold">
                          {interview.date && !isNaN(new Date(interview.date).getTime()) ? format(new Date(interview.date), 'd') : '-'}
                        </span>
                      </div>
                      <div>
                        <Link href={`/applications/${interview.application_id}`} className="font-medium hover:underline block">
                          {interview.applications?.company}
                        </Link>
                        <span className="text-sm text-muted-foreground">{interview.round} • {interview.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
