'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { type Settings } from '@/types';
import { settingsSchema, type SettingsFormValues } from '@/lib/schemas';
import { updateSettingsAction } from '@/app/(main)/settings/actions';

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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsFormProps {
  settings: Settings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { setTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      darkMode: settings.darkMode,
      monthlyGoal: settings.monthlyGoal,
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    const result = await updateSettingsAction(data);
    if (result.success) {
      toast.success('Settings updated');
      setTheme(data.darkMode ? 'dark' : 'light');
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the app looks on your device.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="darkMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Dark Mode</FormLabel>
                    <FormDescription>
                      Enable dark mode for the application interface.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Set targets for your job search.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="monthlyGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Application Goal</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={500} {...field} />
                  </FormControl>
                  <FormDescription>
                    How many applications do you want to submit each month?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
