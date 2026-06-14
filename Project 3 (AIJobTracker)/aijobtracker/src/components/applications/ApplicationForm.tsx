'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApplicationStatus, Priority, type Application } from '@/types';
import { applicationSchema, type ApplicationFormValues } from '@/lib/schemas';
import { createClient } from '@/utils/supabase/client';
import { uploadResume } from '@/lib/db';
import { createApplicationAction, updateApplicationAction } from '@/app/(main)/applications/actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ApplicationFormProps {
  application?: Application; // If provided, we are editing
  onSuccess?: (id?: string) => void;
}

export function ApplicationForm({ application, onSuccess }: ApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const isEditing = !!application;

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company: application?.company || '',
      role: application?.role || '',
      jdLink: application?.jdLink || '',
      location: application?.location || '',
      salary: application?.salary || '',
      status: application?.status || ApplicationStatus.Wishlist,
      priority: application?.priority || Priority.Medium,
      appliedDate: application?.appliedDate || new Date().toISOString().split('T')[0],
      resumeRef: application?.resumeRef || '',
      notes: application?.notes || '',
      recruiter: application?.recruiter || '',
      source: application?.source || '',
      referral: application?.referral || '',
      applicationId: application?.applicationId || '',
    },
  });

  async function onSubmit(data: ApplicationFormValues) {
    setIsSubmitting(true);
    try {
      if (resumeFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const filePath = await uploadResume(supabase, resumeFile, user.id);
            data.resumeRef = filePath;
          } catch (err) {
            toast.error('Failed to upload resume');
            setIsSubmitting(false);
            return;
          }
        }
      }

      if (isEditing && application) {
        const result = await updateApplicationAction(application.id, data);
        if (result.success) {
          toast.success('Application updated');
          onSuccess?.();
        } else {
          toast.error(result.error || 'Failed to update application');
        }
      } else {
        const result = await createApplicationAction(data);
        if (result.success) {
          toast.success('Application created');
          form.reset();
          if (onSuccess) {
            onSuccess(result.id);
          } else {
            router.push(`/applications/${result.id}`);
          }
        } else {
          toast.error(result.error || 'Failed to create application');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role / Title</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ApplicationStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(Priority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Remote, San Francisco, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Salary */}
          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Expectation / Range</FormLabel>
                <FormControl>
                  <Input placeholder="$120k - $150k" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Description Link */}
          <FormField
            control={form.control}
            name="jdLink"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Job Description URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Resume Upload */}
        <div className="space-y-2">
          <FormLabel>Resume Attachment</FormLabel>
          <Input 
            type="file" 
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          />
          {application?.resumeRef && (
            <p className="text-xs text-muted-foreground mt-1">
              Currently attached: {application.resumeRef.split('/').pop()}
            </p>
          )}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any extra context, thoughts, or observations..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Application'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
