'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { bulkInsertApplications } from '@/lib/db';
import { ApplicationStatus, Priority } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function CSVImportButton() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast.error('You must be logged in to import data.');
            return;
          }

          const applications = results.data.map((row: any) => ({
            company: row.Company || row.company || 'Unknown Company',
            role: row.Role || row.role || row.Title || row.title || 'Unknown Role',
            location: row.Location || row.location || '',
            salary: row.Salary || row.salary || '',
            status: Object.values(ApplicationStatus).includes(row.Status as ApplicationStatus) 
              ? (row.Status as ApplicationStatus) 
              : ApplicationStatus.Wishlist,
            priority: Object.values(Priority).includes(row.Priority as Priority) 
              ? (row.Priority as Priority) 
              : Priority.Medium,
            appliedDate: row.AppliedDate || row.appliedDate || new Date().toISOString().split('T')[0],
            notes: row.Notes || row.notes || '',
            jdLink: row.Link || row.jdLink || '',
            tags: [],
            resumeRef: '',
            recruiter: row.Recruiter || row.recruiter || '',
            source: row.Source || row.source || '',
            referral: row.Referral || row.referral || '',
            applicationId: row.ApplicationId || row.applicationId || '',
          }));

          if (applications.length === 0) {
            toast.error('No valid data found in CSV.');
            return;
          }

          await bulkInsertApplications(supabase, applications, user.id);
          
          toast.success(`Successfully imported ${applications.length} applications!`);
          router.refresh();
        } catch (error: any) {
          console.error(error);
          toast.error(error.message || 'Failed to import applications.');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input
          }
        }
      },
      error: (error) => {
        toast.error(`CSV Parsing Error: ${error.message}`);
        setIsImporting(false);
      }
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Import CSV
      </Button>
    </>
  );
}
