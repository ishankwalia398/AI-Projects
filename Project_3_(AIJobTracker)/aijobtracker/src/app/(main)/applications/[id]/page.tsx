import { createClient } from '@/utils/supabase/server';
import { getAllApplications, getResumeUrl } from '@/lib/db';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { Application, Interview, StatusTimelineEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApplicationTimeline } from '@/components/applications/ApplicationTimeline';
import { InterviewList } from '@/components/applications/InterviewList';

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // We fetch all and find, but ideally we use getApplication(id). I'll fetch all to keep it simple for now or fetch single.
  const { data: appData, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !appData) {
    notFound();
  }

  // Fetch related data
  const [timelineResponse, interviewsResponse] = await Promise.all([
    supabase.from('status_timeline').select('*').eq('application_id', id).order('changed_at', { ascending: false }),
    supabase.from('interviews').select('*').eq('application_id', id).order('date', { ascending: true })
  ]);

  const application = appData as unknown as Application;
  const timeline = (timelineResponse.data || []) as unknown as StatusTimelineEntry[];
  const interviews = (interviewsResponse.data || []) as unknown as Interview[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/applications" className={buttonVariants({ variant: "outline", size: "icon" })}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Application</h2>
          <p className="text-muted-foreground">Update details for {application.company}</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="interviews">
            Interviews {interviews.length > 0 && `(${interviews.length})`}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>Make changes to your job application.</CardDescription>
              </div>
              {application.resumeRef && (
                <a 
                  href={getResumeUrl(supabase, application.resumeRef)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  View Resume
                </a>
              )}
            </CardHeader>
            <CardContent>
              <ApplicationForm application={application} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <InterviewList applicationId={application.id} interviews={interviews} />
        </TabsContent>

        <TabsContent value="timeline">
          <ApplicationTimeline timeline={timeline} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
