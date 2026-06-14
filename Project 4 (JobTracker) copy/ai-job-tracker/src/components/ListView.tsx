import React, { useState } from 'react';
import { JobApplication, StatusType, PriorityType } from '../types';
import { Search, SlidersHorizontal, MapPin, Calendar, Clock, Sparkles, Filter, ChevronUp, ChevronDown, ListFilter, Trash2 } from 'lucide-react';

interface ListViewProps {
  applications: JobApplication[];
  onJobRowClick: (id: string) => void;
  onAddJobClick: () => void;
  onDeleteJob: (id: string) => void;
}

type SortField = 'appliedDate' | 'company' | 'role' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

export function ListView({ applications, onJobRowClick, onAddJobClick, onDeleteJob }: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Dynamically extract all unique tags & sources
  const allSources = Array.from(new Set(applications.map(a => a.source).filter(Boolean))) as string[];

  // Filtering Logic
  const filteredApps = applications.filter(app => {
    // Search Query (Company, Role, Notes, Recruiter, Source, Referral)
    const matchesSearch = 
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.recruiter || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.source || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.referral || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || app.priority === filterPriority;
    const matchesSource = filterSource === 'All' || app.source === filterSource;

    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  });

  // Sorting Logic
  const sortedApps = [...filteredApps].sort((a, b) => {
    let valA: any = a[sortField] || '';
    let valB: any = b[sortField] || '';

    if (sortField === 'appliedDate') {
      valA = new Date(a.appliedDate).getTime();
      valB = new Date(b.appliedDate).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getPriorityBadge = (prio: PriorityType) => {
    let colorClass = 'bg-[#FAFBFC] text-[#5E6C84] border-[#DFE1E6]';
    if (prio === 'Urgent') colorClass = 'bg-[#FFEBEE] text-red-700 border-red-200';
    else if (prio === 'High') colorClass = 'bg-[#FFF3E0] text-orange-700 border-orange-200';
    else if (prio === 'Medium') colorClass = 'bg-[#E3F2FD] text-blue-700 border-blue-200';
    return <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${colorClass}`}>{prio}</span>;
  };

  const getStatusBadge = (status: StatusType) => {
    let colorClass = 'bg-[#FAFBFC] text-[#5E6C84] border-[#DFE1E6]';
    if (status === 'Applied') colorClass = 'bg-[#FFF3E0] text-[#E65100] border-orange-200';
    else if (status === 'Follow-up') colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
    else if (status === 'Interview') colorClass = 'bg-[#E3F2FD] text-[#0747A6] border-blue-200';
    else if (status === 'Offer' || status === 'Wishlist') colorClass = 'bg-[#E8F5E9] text-green-700 border-green-200';
    else if (status === 'Rejected') colorClass = 'bg-[#FFEBEE] text-red-700 border-red-200';
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight ${colorClass}`}>{status}</span>;
  };

  return (
    <div className="space-y-4" id="list-view">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-[#DFE1E6]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#172B4D] font-sans">
            Directory Index
          </h1>
          <p className="text-[#5E6C84] text-xs mt-0.5">
            Perform granular search queries, apply custom status limits, and audit chronological priorities.
          </p>
        </div>
        <button
          onClick={onAddJobClick}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-750 text-white font-semibold text-xs rounded transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer self-stretch md:self-auto text-center justify-center"
        >
          Track New Job
        </button>
      </div>

      {/* Controls Container (Search & Filters) */}
      <div className="bg-white p-3 rounded border border-[#DFE1E6] premium-shadow space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Global Search bar */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#5E6C84]">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role, source, notes, referral..."
              className="w-full pl-7 pr-3 py-1.5 bg-white border border-[#DFE1E6] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-[#172B4D] transition-all outline-hidden font-medium"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-2 pr-8 py-1.5 bg-white border border-[#DFE1E6] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-[#172B4D] font-semibold transition-all outline-hidden appearance-none cursor-pointer"
            >
              <option value="All">Status: All</option>
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
            <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-[#5E6C84]">
              <Filter className="h-3 w-3" />
            </span>
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-2 pr-8 py-1.5 bg-white border border-[#DFE1E6] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-[#172B4D] font-semibold transition-all outline-hidden appearance-none cursor-pointer"
            >
              <option value="All">Priority: All</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-[#5E6C84]">
              <SlidersHorizontal className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Extended filter bar */}
        {allSources.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#EBECF0] text-[10px] font-semibold text-[#5E6C84] overflow-x-auto">
            <span className="text-[#5E6C84] shrink-0">Source Filter:</span>
            <button
              onClick={() => setFilterSource('All')}
              className={`px-2 py-0.5 rounded border shrink-0 cursor-pointer ${
                filterSource === 'All' ? 'bg-[#091E42] border-[#091E42] text-white' : 'bg-[#FAFBFC] border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]'
              }`}
            >
              All Sources
            </button>
            {allSources.map(src => (
              <button
                key={src}
                onClick={() => setFilterSource(src)}
                className={`px-2 py-0.5 rounded border shrink-0 cursor-pointer ${
                  filterSource === src ? 'bg-[#091E42] border-[#091E42] text-white' : 'bg-[#FAFBFC] border-[#DFE1E6] text-[#42526E] hover:bg-[#F4F5F7]'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Directory Table Display */}
      <div className="bg-white border border-[#DFE1E6] rounded premium-shadow overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="min-w-full text-left text-[#172B4D] text-xs font-sans">
            <thead className="bg-[#FAFBFC] text-[10px] uppercase font-bold text-[#5E6C84] border-b border-[#DFE1E6] tracking-wider">
              <tr>
                <th onClick={() => toggleSort('company')} className="py-2.5 px-3 cursor-pointer hover:bg-[#FAFBFC] select-none items-center gap-1">
                  Company
                  {sortField === 'company' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)}
                </th>
                <th onClick={() => toggleSort('role')} className="py-2.5 px-3 cursor-pointer hover:bg-[#FAFBFC] select-none">
                  Role
                  {sortField === 'role' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)}
                </th>
                <th onClick={() => toggleSort('appliedDate')} className="py-2.5 px-3 cursor-pointer hover:bg-[#FAFBFC] select-none">
                  Applied Date
                  {sortField === 'appliedDate' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)}
                </th>
                <th onClick={() => toggleSort('priority')} className="py-2.5 px-3 cursor-pointer hover:bg-[#FAFBFC] select-none">
                  Priority
                  {sortField === 'priority' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)}
                </th>
                <th onClick={() => toggleSort('status')} className="py-2.5 px-3 cursor-pointer hover:bg-[#FAFBFC] select-none">
                  Status
                  {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />)}
                </th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBECF0]">
              {sortedApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5E6C84] font-medium">
                    No tracked job applications align with your filter configuration.
                  </td>
                </tr>
              ) : (
                sortedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#F4F5F7] even:bg-[#FAFBFC]/50 border-b border-[#EBECF0] shrink-0 transition-colors cursor-pointer group"
                  >
                    <td onClick={() => onJobRowClick(app.id)} className="py-2 px-3 font-bold text-[#172B4D] group-hover:text-blue-600">
                      {app.company}
                    </td>
                    <td onClick={() => onJobRowClick(app.id)} className="py-2 px-3 font-semibold text-[#42526E]">
                      {app.role}
                    </td>
                    <td onClick={() => onJobRowClick(app.id)} className="py-2 px-3 font-mono text-xs text-[#5E6C84]">
                      {new Date(app.appliedDate).toLocaleDateString([], { dateStyle: 'medium' })}
                    </td>
                    <td onClick={() => onJobRowClick(app.id)} className="py-2 px-3">
                      {getPriorityBadge(app.priority)}
                    </td>
                    <td onClick={() => onJobRowClick(app.id)} className="py-2 px-3">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Do you want to delete ${app.company} (${app.role})?`)) {
                            onDeleteJob(app.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer transition-colors"
                        title="Delete application"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
