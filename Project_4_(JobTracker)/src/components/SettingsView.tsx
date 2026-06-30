import React, { useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { dbGetSettings, dbSaveSettings } from '../lib/db';
import { Settings, Save, Download, Upload, Trash2, Check, Moon, Sun, Info, User as UserIcon } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
  onImportSuccess: () => void;
}

export function SettingsView({ user, onLogout, onImportSuccess }: SettingsViewProps) {
  const [goal, setGoal] = useState<number>(10);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [resumeText, setResumeText] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Load setting triggers
    dbGetSettings(user.username).then((settings) => {
      setGoal(settings.monthlyGoal || 10);
      setDarkMode(settings.darkMode || false);
      
      // Load stored resume text if any
      const storedResume = localStorage.getItem(`ai_tracker_resume_${user.username}`) || '';
      setResumeText(storedResume);
    });
  }, [user.username]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    try {
      await dbSaveSettings({
        userId: user.username,
        darkMode,
        monthlyGoal: goal,
      });

      // Save resume text in localStorage
      localStorage.setItem(`ai_tracker_resume_${user.username}`, resumeText);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export DB as standard JSON file
  const handleExportData = async () => {
    try {
      // Dynamic query of internal IndexedDB structure
      const dbRequest = indexedDB.open('AIJobTrackerDB');
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const transaction = db.transaction(['applications', 'status_timeline', 'interviews', 'settings'], 'readonly');
        
        const dump: any = { exportDate: new Date().toISOString(), username: user.username };
        const stores = ['applications', 'status_timeline', 'interviews', 'settings'];
        let completed = 0;

        stores.forEach(storeName => {
          const store = transaction.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => {
            // Filter records belonging to this user
            if (storeName === 'applications') {
              dump.applications = (req.result || []).filter((a: any) => a.userId === user.username);
            } else if (storeName === 'settings') {
              dump.settings = (req.result || []).filter((s: any) => s.userId === user.username);
            } else {
              // Timeline/Interviews are sub-records, fetch all
              dump[storeName] = req.result || [];
            }
            completed++;
            if (completed === stores.length) {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `AIJobTracker_Backup_${user.username}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }
          };
        });
      };
    } catch (err) {
      console.error(err);
    }
  };

  // Import JSON back
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.applications || !Array.isArray(data.applications)) {
          throw new Error("Invalid backup file format: 'applications' array missing.");
        }

        const dbRequest = indexedDB.open('AIJobTrackerDB');
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction(['applications', 'status_timeline', 'interviews', 'settings'], 'readwrite');
          
          // 1. Restore applications
          const appStore = transaction.objectStore('applications');
          data.applications.forEach((app: any) => {
            app.userId = user.username; // Bind back to current profile
            appStore.put(app);
          });

          // 2. Restore timelines
          if (Array.isArray(data.status_timeline)) {
            const timelineStore = transaction.objectStore('status_timeline');
            data.status_timeline.forEach((item: any) => timelineStore.put(item));
          }

          // 3. Restore interviews
          if (Array.isArray(data.interviews)) {
            const interviewStore = transaction.objectStore('interviews');
            data.interviews.forEach((item: any) => interviewStore.put(item));
          }

          transaction.oncomplete = () => {
            setImportSuccess(true);
            onImportSuccess();
          };
          transaction.onerror = () => {
            setImportError("Database write error during backup injection");
          };
        };
      } catch (err: any) {
        setImportError(err.message || "Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8" id="settings-view">
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
          Preferences & Backup
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Customize search criteria, configure default resume data feeds, and perform complete IndexedDB imports or exports.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Core settings form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          
          {/* General tracker metrics inputs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-slate-400" />
              Tracker Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Target Applications Goal (Monthly)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs sm:text-sm text-slate-900 transition-all font-semibold outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">Triggers dashboard speedometers and progress scales.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  UX Dark Mode
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all ${
                      darkMode ? 'bg-slate-900 text-amber-400 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                  <span className="text-xs font-semibold text-slate-600">{darkMode ? 'Active' : 'Deactivated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Master Resume Asset Feed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow space-y-4">
            <div className="flex justify-between items-baseline border-b border-slate-50 pb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="h-4.5 w-4.5 text-slate-400" />
                Master Resume / Profile Feed
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Feeds AI Tools</span>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Paste your default technical/general resume content below. This ensures AI cover letter draft tools and match score systems access your experience details automatically, without repeating file uploads.
              </p>
              <textarea
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="e.g. SOFTWARE ENGINE PROFILE&#10;&#10;Technical Skills: React, TypeScript, Node.js, RESTful systems, PostgreSQL...&#10;&#10;Work Experience:&#10;- Senior UI Architect at Meta (2024-Present)&#10;- Software Developer at Stripe (2021-2024)..."
                className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-mono text-slate-700 transition-all outline-hidden leading-relaxed"
              ></textarea>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex justify-end gap-3">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-bold self-center animate-fade-in flex items-center gap-1">
                <Check className="h-4 w-4 stroke-[3]" /> Profiles Saved Successfully
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Commit Updates
            </button>
          </div>
        </form>

        {/* Sidebar side-panel: imports and profile actions */}
        <div className="space-y-6">
          
          {/* Backup Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 premium-shadow space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">
              Dump / Restore Database
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              IndexedDB caches all applications and timeline nodes inside your local browser memory space. To protect your search progress, perform periodic backup exports.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                <Download className="h-4 w-4 text-slate-500" />
                Export Data Backup (.json)
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-db-input"
                />
                <label
                  htmlFor="import-db-input"
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                  Restore / Import Backup
                </label>
              </div>

              {importSuccess && (
                <div className="p-2 text-center bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">
                  Backup restored successfully!
                </div>
              )}

              {importError && (
                <div className="p-2 text-center bg-red-50 border border-red-100 text-red-600 rounded-md text-[10px] leading-tight">
                  {importError}
                </div>
              )}
            </div>
          </div>

          {/* Log Out card */}
          <div className="bg-rose-50/20 p-6 rounded-2xl border border-rose-100/30 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolate application records or clear cache parameters. Terminating active sessions automatically commits cache references safely.
            </p>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              Sign out of Profile
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
