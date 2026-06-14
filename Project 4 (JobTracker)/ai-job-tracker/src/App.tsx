import React, { useState, useEffect } from 'react';
import { User, JobApplication, StatusType } from './types';
import { dbGetApplications, initDB } from './lib/db';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { ListView } from './components/ListView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { 
  Compass, LayoutGrid, Database, Calendar, TrendingUp, Settings, 
  LogOut, Briefcase, Plus, Menu, X, Sparkles, User as UserIcon 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // Modal control states
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [initialModalStatus, setInitialModalStatus] = useState<StatusType | undefined>(undefined);

  // Hydrate user session on launch
  useEffect(() => {
    // Confirm IndexedDB initialized
    initDB().then(() => {
      const saved = localStorage.getItem('ai_job_tracker_session_user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, []);

  // Fetch applications for active user
  const fetchApplicationsData = async () => {
    if (!user) return;
    try {
      const list = await dbGetApplications(user.username);
      setApplications(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplicationsData();
    } else {
      setApplications([]);
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    localStorage.setItem('ai_job_tracker_session_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('ai_job_tracker_session_user');
    setUser(null);
  };

  // Quick helper to alter statuses on dragging
  const handleUpdateStatus = async (id: string, newStatus: StatusType) => {
    try {
      // Find and update in IndexedDB
      const appIndex = applications.findIndex(a => a.id === id);
      if (appIndex !== -1) {
        const target = { ...applications[appIndex] };
        const oldStatus = target.status;
        target.status = newStatus;
        target.updatedAt = new Date().toISOString();

        // Save
        const { dbSaveApplication, dbAddTimelineEvent, dbAddActivity } = await import('./lib/db');
        await dbSaveApplication(target);
        
        if (oldStatus !== newStatus) {
          await dbAddTimelineEvent(crypto.randomUUID(), id, newStatus, new Date().toISOString());
          await dbAddActivity(user!.username, `Shifted pipeline status of ${target.company} to '${newStatus}' via board drag`, id);
        }

        fetchApplicationsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Job Row
  const handleDeleteJob = async (id: string) => {
    try {
      const { dbDeleteApplication } = await import('./lib/db');
      await dbDeleteApplication(id);
      fetchApplicationsData();
    } catch (e) {
      console.error(e);
    }
  };

  // Open modal in creation mode
  const handleOpenAddJob = (initialStatus?: StatusType) => {
    setInitialModalStatus(initialStatus);
    setSelectedJobId(null);
    setShowJobModal(true);
  };

  // Open modal in edit mode
  const handleOpenEditJob = (id: string) => {
    setSelectedJobId(id);
    setInitialModalStatus(undefined);
    setShowJobModal(true);
  };

  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Visual Tab mappings: Sidebar Controls
  const sidebarTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'board', label: 'Kanban Pipeline', icon: LayoutGrid },
    { id: 'list', label: 'Directory Index', icon: Database },
    { id: 'calendar', label: 'Calendars', icon: Calendar },
    { id: 'analytics', label: 'Analytics & Funnels', icon: TrendingUp },
    { id: 'settings', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="flex bg-[#F4F5F7] min-h-screen text-[#172B4D] font-sans antialiased" id="app-workspace">
      
      {/* 1. Sidebar Panel Navigators (Desktop) */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#091E42] border-r border-[#ffffff10] text-[#C1C7D0] select-none shrink-0 sticky top-0 h-screen justify-between p-4">
        <div className="space-y-6">
          
          {/* Main Logo icon */}
          <div className="flex items-center gap-2 px-2 py-3 border-b border-[#ffffff10] mb-2">
            <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center font-bold text-xs italic text-white">
              AI
            </div>
            <div className="font-bold text-lg tracking-tight text-white">
              JobTracker
            </div>
          </div>

          {/* Nav buttons list */}
          <nav className="space-y-1">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-left transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white font-semibold shadow-xs' 
                      : 'text-[#C1C7D0] hover:text-white hover:bg-[#ffffff10]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#C1C7D0]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Profile / User session details) */}
        <div className="pt-3 border-t border-[#ffffff10] flex flex-col gap-2.5">
          <div className="p-2.5 bg-[#ffffff08] rounded-lg border border-[#ffffff10] flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="grow min-w-0">
              <div className="font-bold text-xs text-white truncate leading-none">{user.fullName || user.username}</div>
              <div className="text-[9px] text-[#A5ADBA] font-mono truncate mt-0.5">{user.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-1.5 bg-[#ffffff08] hover:bg-red-950/20 border border-[#ffffff10] hover:border-red-900/30 text-rose-400 hover:text-red-300 font-semibold text-[11px] rounded transition-colors cursor-pointer flex justify-center items-center gap-1.5"
          >
            <LogOut className="h-3 w-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Responsive mobile container / Header triggers */}
      <div className="grow flex flex-col min-w-0">
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 border-b border-slate-800 sticky top-0 z-40 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-emerald-500 rounded text-slate-950 font-sans font-extrabold text-[10px]">
              AI
            </div>
            <span className="font-extrabold tracking-tight text-sm">AIJobtracker</span>
          </div>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 bg-slate-850 border border-slate-800 text-slate-300 rounded-lg cursor-pointer"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer Dropdown */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[53px] z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-6 flex flex-col gap-4 animate-slide-down">
            <nav className="space-y-1">
              {sidebarTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-left font-medium transition-colors ${
                      isActive 
                        ? 'bg-slate-800 text-white font-bold border-l-4 border-emerald-400' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 w-full py-2.5 bg-slate-800 text-rose-400 font-bold text-xs rounded-lg transition-colors cursor-pointer flex justify-center items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* 3. Primary Workspace Views */}
        <main className="grow p-4 sm:p-5 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              applications={applications}
              onNavigate={(tab) => setActiveTab(tab)}
              onAddJobClick={() => handleOpenAddJob()}
              onRefreshData={fetchApplicationsData}
            />
          )}

          {activeTab === 'board' && (
            <KanbanBoardView
              applications={applications}
              onUpdateStatus={handleUpdateStatus}
              onJobCardClick={handleOpenEditJob}
              onAddJobClick={handleOpenAddJob}
            />
          )}

          {activeTab === 'list' && (
            <ListView
              applications={applications}
              onJobRowClick={handleOpenEditJob}
              onAddJobClick={() => handleOpenAddJob()}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              user={user}
              onJobClick={handleOpenEditJob}
              applications={applications}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              applications={applications}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              onLogout={handleLogout}
              onImportSuccess={fetchApplicationsData}
            />
          )}
        </main>
      </div>

      {/* 4. Overlay edit job details dialog modal */}
      {showJobModal && (
        <ApplicationDetailModal
          user={user}
          applicationId={selectedJobId}
          initialStatus={initialModalStatus}
          onClose={() => {
            setShowJobModal(false);
            setInitialModalStatus(undefined);
            setSelectedJobId(null);
          }}
          onSaveSuccess={() => {
            setShowJobModal(false);
            setInitialModalStatus(undefined);
            setSelectedJobId(null);
            fetchApplicationsData();
          }}
        />
      )}

    </div>
  );
}
