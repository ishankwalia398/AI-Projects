import { createClient } from '@/utils/supabase/server';
import { getAllApplications } from '@/lib/db';
import { ApplicationsTable } from '@/components/applications/ApplicationsTable';
import { CSVImportButton } from '@/components/applications/CSVImportButton';
import { buttonVariants } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const applications = await getAllApplications(supabase);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
          <p className="text-muted-foreground">View and manage all your job applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportButton />
          <Link href="/applications/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Link>
        </div>
      </div>

      <ApplicationsTable applications={applications} />
    </div>
  );
}
