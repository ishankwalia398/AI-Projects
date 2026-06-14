'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Application, PRIORITY_COLORS, STATUS_COLORS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

interface ApplicationsTableProps {
  applications: Application[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = applications.filter((app) => 
    app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search company, role..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              filteredApps.map((app) => (
                <TableRow 
                  key={app.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/applications/${app.id}`)}
                >
                  <TableCell className="font-medium">{app.company}</TableCell>
                  <TableCell>{app.role}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      style={{ 
                        backgroundColor: STATUS_COLORS[app.status] + '20',
                        color: STATUS_COLORS[app.status],
                      }}
                    >
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: PRIORITY_COLORS[app.priority],
                        color: PRIORITY_COLORS[app.priority]
                      }}
                    >
                      {app.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {app.appliedDate && !isNaN(new Date(app.appliedDate).getTime()) ? format(new Date(app.appliedDate), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{app.location || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
