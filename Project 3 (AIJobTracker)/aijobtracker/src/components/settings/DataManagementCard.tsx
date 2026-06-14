'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { exportDataAction, importDataAction } from '@/app/(main)/settings/data-actions';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { Download, Upload } from 'lucide-react';

export function DataManagementCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const result = await exportDataAction();
      if (result.success && result.data) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aijobtracker_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Export successful');
      } else {
        toast.error('Export failed');
      }
    } catch (e) {
      toast.error('Export failed');
    }
    setIsExporting(false);
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const result = await exportDataAction();
      if (result.success && result.data) {
        // Flatten data for CSV
        const flatData = result.data.map((app: any) => {
          const { interviews, timeline, ...rest } = app;
          return rest;
        });
        const csvStr = Papa.unparse(flatData);
        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aijobtracker_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Export successful');
      } else {
        toast.error('Export failed');
      }
    } catch (e) {
      toast.error('Export failed');
    }
    setIsExporting(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let parsedData: any[] = [];

        if (file.name.endsWith('.json')) {
          parsedData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const result = Papa.parse(content, { header: true, skipEmptyLines: true });
          parsedData = result.data;
        } else {
          toast.error('Unsupported file format. Please use .json or .csv');
          setIsImporting(false);
          return;
        }

        if (!Array.isArray(parsedData)) {
          throw new Error('Invalid data format');
        }

        const importResult = await importDataAction(parsedData);
        if (importResult.success) {
          toast.success('Data imported successfully');
        } else {
          toast.error(importResult.error || 'Import failed');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file or import data');
      }
      setIsImporting(false);
      // Reset input
      e.target.value = '';
    };

    reader.onerror = () => {
      toast.error('Error reading file');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export your applications or import from another source.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Export Data</h3>
          <p className="text-sm text-muted-foreground">Download all your applications, interviews, and timelines.</p>
          <div className="flex gap-4 pt-2">
            <Button variant="outline" onClick={handleExportJson} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportCsv} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Import Data</h3>
          <p className="text-sm text-muted-foreground">Upload a JSON or CSV file to import applications. JSON imports preserve interviews.</p>
          <div className="pt-2">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".json,.csv"
                onChange={handleImportFile}
                disabled={isImporting}
                className="max-w-[300px]"
              />
              {isImporting && <span className="text-sm text-muted-foreground">Importing...</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
