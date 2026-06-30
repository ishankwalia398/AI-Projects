'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Interview } from '@/types';
import { format } from 'date-fns';
import { CalendarDays, Clock, Video, MapPin, Phone, Trash2, Plus } from 'lucide-react';
import { deleteInterviewAction, addInterviewAction } from '@/app/(main)/applications/actions';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { interviewSchema, type InterviewFormValues } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InterviewListProps {
  applicationId: string;
  interviews: Interview[];
}

export function InterviewList({ applicationId, interviews }: InterviewListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      applicationId,
      round: 'HR',
      mode: 'Video',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      interviewer: '',
      link: '',
      notes: '',
    },
  });

  const onSubmit = async (data: InterviewFormValues) => {
    setIsSubmitting(true);
    const result = await addInterviewAction(data);
    if (result.success) {
      toast.success('Interview scheduled!');
      setOpen(false);
      form.reset();
    } else {
      toast.error(result.error || 'Failed to schedule interview');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const result = await deleteInterviewAction(id);
    if (result.success) {
      toast.success('Interview deleted');
    } else {
      toast.error('Failed to delete interview');
    }
    setIsDeleting(null);
  };

  const getIcon = (mode: string) => {
    if (mode === 'Video') return <Video className="h-4 w-4" />;
    if (mode === 'Phone') return <Phone className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Interview
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>Add a new interview round for this application.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="round"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Round</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['HR', 'Technical', 'Manager', 'Director', 'Final'].map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['In-Person', 'Video', 'Phone'].map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="interviewer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interviewer (Optional)</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Link (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://zoom.us/..." type="url" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No interviews scheduled yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{interview.round} Round</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    disabled={isDeleting === interview.id}
                    onClick={() => handleDelete(interview.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-1">
                  {getIcon(interview.mode)} {interview.mode}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{interview.date && !isNaN(new Date(interview.date).getTime()) ? format(new Date(interview.date), 'MMM d, yyyy') : 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{interview.time}</span>
                  </div>
                  {interview.interviewer && (
                    <div className="text-muted-foreground mt-2">
                      <span className="font-medium text-foreground">Interviewer:</span> {interview.interviewer}
                    </div>
                  )}
                  {interview.link && (
                    <div className="mt-2">
                      <a 
                        href={interview.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
