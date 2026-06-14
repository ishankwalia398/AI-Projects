import React, { useState, useEffect } from 'react';
import { JobApplication, StatusType, PriorityType, StatusTimeline, Interview, ActivityLog, User } from '../types';
import { 
  dbGetTimeline, dbAddTimelineEvent, dbGetInterviewsForApp, dbSaveInterview, 
  dbDeleteInterview, dbAddActivity, dbSaveApplication, dbDeleteApplication 
} from '../lib/db';
import { 
  X, Save, Calendar, Sparkles, Plus, Trash2, Clock, CheckCircle2, Copy, Play, 
  Video, Link, Award, FileText, CheckCircle, ShieldAlert, BadgeInfo 
} from 'lucide-react';

interface ApplicationDetailModalProps {
  user: User;
  applicationId: string | null; // null represents adding a new job
  initialStatus?: StatusType;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface MatchScoreResult {
  score: number;
  missingKeywords: string[];
  tips: string[];
  executiveSummary: string;
}

export function ApplicationDetailModal({ user, applicationId, initialStatus, onClose, onSaveSuccess }: ApplicationDetailModalProps) {
  const isEditMode = !!applicationId;

  // Active sub-tab in Modal
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'interviews' | 'ai'>('info');

  // Application fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jdLink, setJdLink] = useState('');
  const [jdText, setJdText] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [status, setStatus] = useState<StatusType>(initialStatus || 'Wishlist');
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [recruiter, setRecruiter] = useState('');
  const [source, setSource] = useState('');
  const [referral, setReferral] = useState('');
  const [qaAppId, setQaAppId] = useState('');

  // Timeline & Interviews substates
  const [timeline, setTimeline] = useState<StatusTimeline[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [saving, setSaving] = useState(false);

  // Sub-Form for adding interview
  const [intDate, setIntDate] = useState(new Date().toISOString().split('T')[0]);
  const [intTime, setIntTime] = useState('09:00');
  const [intMode, setIntMode] = useState<'In-Person' | 'Zoom' | 'Google Meet' | 'Take-Home' | 'Phone' | 'Other'>('Google Meet');
  const [intLink, setIntLink] = useState('');
  const [intInterviewer, setIntInterviewer] = useState('');
  const [intRound, setIntRound] = useState<'HR' | 'Technical' | 'Manager' | 'Director' | 'Final' | 'Other'>('Technical');

  // AI states
  const [aiDocType, setAiDocType] = useState<'cover_letter' | 'linkedin_outreach'>('cover_letter');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  
  const [matchResult, setMatchResult] = useState<MatchScoreResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // 1. Initial Data hydration
  useEffect(() => {
    if (isEditMode && applicationId) {
      // Setup edit values
      const txRequest = indexedDB.open('AIJobTrackerDB');
      txRequest.onsuccess = () => {
        const db = txRequest.result;
        const tx = db.transaction(['applications'], 'readonly');
        const store = tx.objectStore('applications');
        const req = store.get(applicationId);
        
        req.onsuccess = () => {
          const app = req.result as JobApplication;
          if (app) {
            setCompany(app.company);
            setRole(app.role);
            setJdLink(app.jdLink || '');
            setJdText(app.jdText || '');
            setLocation(app.location || '');
            setSalary(app.salary || '');
            setStatus(app.status);
            setPriority(app.priority);
            setTags(app.tags || []);
            setTagsInput(app.tags?.join(', ') || '');
            setAppliedDate(app.appliedDate);
            setNotes(app.notes || '');
            setRecruiter(app.recruiter || '');
            setSource(app.source || '');
            setReferral(app.referral || '');
            setQaAppId(app.applicationId || '');
          }
        };
      };

      // Chronological timelines & schedules
      dbGetTimeline(applicationId).then(setTimeline);
      dbGetInterviewsForApp(applicationId).then(setInterviews);
    } else {
      // Clear inputs
      setCompany('');
      setRole('');
      setJdLink('');
      setJdText('');
      setLocation('');
      setSalary('');
      setStatus(initialStatus || 'Wishlist');
      setPriority('Medium');
      setTags([]);
      setTagsInput('');
      setAppliedDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setRecruiter('');
      setSource('');
      setReferral('');
      setQaAppId('');
    }
  }, [applicationId, isEditMode, initialStatus]);

  // Handle Tag inputs (parsed by commas)
  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    const parsed = val.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    setTags(parsed);
  };

  // Submit Job Application updates
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      alert("Company Name and Job Role are required fields.");
      return;
    }

    setSaving(true);
    const appId = applicationId || crypto.randomUUID();
    const actionDesc = isEditMode 
      ? `Modified tracking details for ${company} (${role})` 
      : `Added new active tracker: ${company} (${role}) under swimwear pipeline`;

    const updatedApp: JobApplication = {
      id: appId,
      userId: user.username,
      company: company.trim(),
      role: role.trim(),
      jdLink: jdLink.trim(),
      jdText: jdText.trim(),
      location: location.trim(),
      salary: salary.trim(),
      status,
      priority,
      tags,
      appliedDate,
      notes: notes.trim(),
      recruiter: recruiter.trim(),
      source: source.trim(),
      referral: referral.trim(),
      applicationId: qaAppId.trim(),
      createdAt: isEditMode ? '' : new Date().toISOString(), // updated internally during put or fetched
      updatedAt: new Date().toISOString(),
    };

    try {
      // Check if status changed to log chronological timelines
      if (isEditMode && applicationId) {
        // Query original status to see if it shifted
        const dbRequest = indexedDB.open('AIJobTrackerDB');
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const store = db.transaction('applications', 'readonly').objectStore('applications').get(applicationId);
          store.onsuccess = async () => {
            const original = store.result as JobApplication;
            updatedApp.createdAt = original?.createdAt || new Date().toISOString();
            
            await dbSaveApplication(updatedApp);
            
            if (original && original.status !== status) {
              await dbAddTimelineEvent(crypto.randomUUID(), appId, status, new Date().toISOString());
              await dbAddActivity(user.username, `Shifted pipeline status of ${company} to '${status}'`, appId);
            } else {
              await dbAddActivity(user.username, `Updated details of ${company} application`, appId);
            }
            setSaving(false);
            onSaveSuccess();
          };
        };
      } else {
        await dbSaveApplication(updatedApp);
        await dbAddTimelineEvent(crypto.randomUUID(), appId, status, new Date().toISOString());
        await dbAddActivity(user.username, actionDesc, appId);
        setSaving(false);
        onSaveSuccess();
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  // Scheduling multiple interviews rounds
  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode || !applicationId) return;

    const newInt: Interview = {
      id: crypto.randomUUID(),
      applicationId,
      date: intDate,
      time: intTime,
      mode: intMode,
      link: intLink.trim() || undefined,
      interviewer: intInterviewer.trim() || undefined,
      round: intRound,
    };

    try {
      await dbSaveInterview(newInt);
      await dbAddActivity(user.username, `Scheduled an ${intRound} Interview loop with ${company}`, applicationId);
      
      // Refresh list
      const updated = await dbGetInterviewsForApp(applicationId);
      setInterviews(updated);

      // Reset interview sub-inputs
      setIntInterviewer('');
      setIntLink('');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete an interview round
  const handleDeleteInterview = async (id: string, roundName: string) => {
    if (!confirm(`Do you want to delete this ${roundName} Round Schedule?`)) return;
    try {
      await dbDeleteInterview(id);
      await dbAddActivity(user.username, `Canceled interview schedule item: ${roundName} round with ${company}`, applicationId || undefined);
      
      const updated = await dbGetInterviewsForApp(applicationId!);
      setInterviews(updated);
    } catch (e) {
      console.error(e);
    }
  };

  // AI: Call generate outreach cover letter
  const handleGenerateCoverLetter = async () => {
    if (!jdText.trim()) {
      alert("Please paste the Job Description text first to align parameters.");
      return;
    }
    setAiLoading(true);
    setAiOutput('');

    const defaultResume = localStorage.getItem(`ai_tracker_resume_${user.username}`) || '';

    try {
      const resp = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          resumeText: defaultResume,
          role,
          company,
          type: aiDocType
        })
      });

      if (!resp.ok) throw new Error(await resp.text() || "Failed to generate text copy.");
      
      const data = await resp.json();
      setAiOutput(data.result);
    } catch (err: any) {
      setAiOutput(`AI generation failed: ${err.message || 'Check model API keys'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(aiOutput);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 2000);
  };

  // AI: ATS Match percentage and missing keywords
  const handleFetchMatchScore = async () => {
    if (!jdText.trim()) {
      alert("ATS Optimizer is missing job specifications. Paste the Job Description in the Info tab.");
      return;
    }

    const defaultResume = localStorage.getItem(`ai_tracker_resume_${user.username}`) || '';
    if (!defaultResume.trim()) {
      alert("Your Profile/Resume content in Settings is empty. Configure it first or paste experience summary in the info tab.");
      return;
    }

    setMatchLoading(true);
    setMatchResult(null);

    try {
      const resp = await fetch('/api/ai/match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText,
          resumeText: defaultResume
        })
      });

      if (!resp.ok) throw new Error(await resp.text() || "Failed to calculate alignment score.");
      const data = await resp.json();
      setMatchResult(data);
    } catch (err: any) {
      alert(`Match calculations failed to load: ${err.message}`);
    } finally {
      setMatchLoading(false);
    }
  };

  // Local readiness checker rules (Calculate readiness score out of 100)
  const calculateReadinessScore = () => {
    let score = 0;
    const checklist = [];

    // 1. Core items
    if (company) { score += 15; checklist.push({ name: "Company added", ok: true }); }
    else { checklist.push({ name: "Company added", ok: false }); }

    if (role) { score += 15; checklist.push({ name: "Role added", ok: true }); }
    else { checklist.push({ name: "Role added", ok: false }); }

    if (location) { score += 10; checklist.push({ name: "Location specified", ok: true }); }
    else { checklist.push({ name: "Location specified", ok: false }); }

    if (jdLink || jdText) { score += 15; checklist.push({ name: "JD specifications configured", ok: true }); }
    else { checklist.push({ name: "JD specifications configured", ok: false }); }

    // 2. Extra logs
    if (recruiter) { score += 15; checklist.push({ name: "Recruiter contacts tracked", ok: true }); }
    else { checklist.push({ name: "Recruiter contacts tracked", ok: false }); }

    if (notes) { score += 15; checklist.push({ name: "Performance notes updated", ok: true }); }
    else { checklist.push({ name: "Performance notes updated", ok: false }); }

    if (interviews.length > 0) { score += 15; checklist.push({ name: "Schedules logged", ok: true }); }
    else { checklist.push({ name: "Schedules logged", ok: false }); }

    return { score, checklist };
  };

  const readinessData = calculateReadinessScore();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#091E42]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6" id="application-detail-modal">
      
      {/* Container dialogue box */}
      <div className="bg-white rounded border border-[#DFE1E6] shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        
        {/* Upper title header bar */}
        <div className="bg-[#091E42] text-white p-3 px-5 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A5ADBA]">
              {isEditMode ? 'Modify Job Tracker Node' : 'Initialize Active Job Tracker'}
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight mt-0.5 leading-none">
              {isEditMode ? `${company} — ${role}` : 'Add New Application Record'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-1.5 bg-white/10 hover:bg-white/20 text-[#A5ADBA] hover:text-white rounded cursor-pointer transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal views navigation bar */}
        <div className="bg-[#F4F5F7] border-b border-[#DFE1E6] p-1.5 sm:px-5 flex gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0 ${
              activeTab === 'info' ? 'bg-[#091E42] text-white font-bold' : 'text-[#42526E] hover:bg-[#EBECF0]'
            }`}
          >
            Tracking Information
          </button>

          {isEditMode && (
            <>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'timeline' ? 'bg-[#091E42] text-white font-bold' : 'text-[#42526E] hover:bg-[#EBECF0]'
                }`}
              >
                Pipeline Timeline & Logs
              </button>
              
              <button
                onClick={() => setActiveTab('interviews')}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'interviews' ? 'bg-[#091E42] text-white font-bold shadow-2xs' : 'text-[#42526E] hover:bg-[#EBECF0]'
                }`}
              >
                Interview Loops ({interviews.length})
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded border flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  activeTab === 'ai' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-[#42526E] border-[#DFE1E6] hover:bg-[#FAFBFC]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Career Tools Map
              </button>
            </>
          )}
        </div>

        {/* Central views panel (Scrollable) */}
        <div className="grow p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: Tracking Information inputs */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveApp} className="space-y-6">
              
              {/* Primary parameters (Role, Company) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Vercel, Linear"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-950 transition-all outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Job Role / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Frontend UI Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-950 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Status and Priority options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Pipeline Status Swimlane
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-bold text-slate-700 transition-all outline-hidden"
                  >
                    <option value="Wishlist">Wishlist</option>
                    <option value="Applied">Applied</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-bold text-slate-700 transition-all outline-hidden font-sans"
                  >
                    <option value="Urgent">Urgent priority</option>
                    <option value="High">High priority</option>
                    <option value="Medium">Medium priority</option>
                    <option value="Low">Low priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Applied Date
                  </label>
                  <input
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Salary & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Compensation Bracket / Salary Range
                  </label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. $140,000 - $180k + Equity"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-all outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Location Range
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA (Hybrid) or Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* JD Specifications & Link mapping */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                      Job Spec Link
                    </label>
                    <input
                      type="url"
                      value={jdLink}
                      onChange={(e) => setJdLink(e.target.value)}
                      placeholder="e.g. https://careers.company.com/job/1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-all outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                      Skill chip tag filters
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="e.g. React, Nextjs, Go, Senior (comma separated)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-all outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                    Job Description Full Text (For ATS Scoring & Outreach)
                  </label>
                  <textarea
                    rows={4}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste job description text contents to unlock ATS matching rate assessments..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs text-slate-700 font-sans transition-all outline-hidden leading-relaxed"
                  ></textarea>
                </div>
              </div>

              {/* Recruiter / Referrals (QA and source logs) */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Networking Context & QA Parameters</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Recruiter Contact</label>
                    <input
                      type="text"
                      value={recruiter}
                      onChange={(e) => setRecruiter(e.target.value)}
                      placeholder="e.g. Susan Jenkins"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Source Pipeline</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. LinkedIn, Indeed"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Referral Node</label>
                    <input
                      type="text"
                      value={referral}
                      onChange={(e) => setReferral(e.target.value)}
                      placeholder="e.g. John (Manager)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">QA Reference ID</label>
                    <input
                      type="text"
                      value={qaAppId}
                      onChange={(e) => setQaAppId(e.target.value)}
                      placeholder="e.g. REQ-9304"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 focus:border-slate-400 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Narrative notes field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1">
                  Chronological Log / Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keep an audit log of client call feedback, technical task scope parameters..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-400 rounded-lg text-xs text-slate-700 transition-all outline-hidden leading-relaxed"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 shrink-0">
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Do you want to delete this job application for ${company}?`)) {
                        await dbDeleteApplication(applicationId);
                        await dbAddActivity(user.username, `Deleted job tracker: ${company} (${role})`, undefined);
                        onSaveSuccess();
                      }
                    }}
                    className="p-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Remove Tracker
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Committing...' : 'Commit Tracker'}
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: Timestamps History Log */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Automated Audit Timeline Trail</h3>
                <p className="text-[11px] text-slate-500 leading-normal mb-4">
                  AIJobtracker preserves a continuous chronological log of every status adjustment with unique micro-second timestamps.
                </p>

                <div className="space-y-4">
                  {timeline.map((item, idx) => (
                    <div key={item.id} className="relative pl-6 pb-2 border-l border-slate-200/60 last:border-0 last:pb-0">
                      <span className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-900 border border-white"></span>
                      <div className="text-xs font-bold text-slate-800 flex gap-2 items-center">
                        Joined swimlane status:
                        <span className="px-2 py-0.5 bg-slate-150 border rounded-full text-[10px] bg-slate-200 font-semibold">{item.status}</span>
                      </div>
                      <div className="font-mono text-[10.5px] text-slate-400 mt-1">
                        Logged on: {new Date(item.changedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Schedule Interview rounds */}
          {activeTab === 'interviews' && (
            <div className="space-y-6">
              
              {/* Existing Interview Lists */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Rounds</span>
                
                {interviews.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 bg-slate-50/50 border border-dashed rounded-xl text-xs">
                    No interview rounds scheduled for this tracking node currently. Use the planner sub-sheet below to queue round structures.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {interviews.map((int) => (
                      <div key={int.id} className="p-4 bg-white border border-slate-200 rounded-xl relative hover:border-slate-300 transition-all flex flex-col justify-between">
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-1">
                            <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[9px] font-bold rounded uppercase tracking-wider">
                              {int.round} Loop
                            </span>
                            <button
                              onClick={() => handleDeleteInterview(int.id, int.round)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-5 light:hover:text-red-600 transition-all cursor-pointer"
                              title="Delete interview round"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-xs font-medium space-y-1.5 text-slate-500 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{new Date(int.date).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span>Starts at: {int.time || 'TBD'}</span>
                            </div>
                            {int.interviewer && (
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="truncate">Contact: {int.interviewer}</span>
                              </div>
                            )}
                            {int.link && (
                              <div className="flex items-center gap-1.5 truncate text-sky-600">
                                <Video className="h-4 w-4 text-slate-400" />
                                <span className="truncate underline font-semibold select-all text-[10px]">{int.link}</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add interview Subform */}
              <form onSubmit={handleSaveInterview} className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Set Up Interview Loop Schedulers
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interview Round</label>
                    <select
                      value={intRound}
                      onChange={(e) => setIntRound(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="HR">HR Screen</option>
                      <option value="Technical">Technical Round</option>
                      <option value="Manager">Manager Round</option>
                      <option value="Director">Director Round</option>
                      <option value="Final">Final Round</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interview Date</label>
                    <input
                      type="date"
                      value={intDate}
                      onChange={(e) => setIntDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      type="time"
                      value={intTime}
                      onChange={(e) => setIntTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mode of meeting</label>
                    <select
                      value={intMode}
                      onChange={(e) => setIntMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom Link</option>
                      <option value="Phone">Phone Dial-in</option>
                      <option value="In-Person">In-Person Address</option>
                      <option value="Take-Home">Take-Home Specs</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interviewer Details & Name</label>
                    <input
                      type="text"
                      value={intInterviewer}
                      onChange={(e) => setIntInterviewer(e.target.value)}
                      placeholder="e.g. Susan Jenkins (Technical Lead)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Virtual Call Video URI / Meet Address</label>
                  <input
                    type="text"
                    value={intLink}
                    onChange={(e) => setIntLink(e.target.value)}
                    placeholder="e.g. Google Meet URL or company address coordinates..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Commit Round Schedulers
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 4: Core AI Career Suites */}
          {activeTab === 'ai' && (
            <div className="space-y-8">
              
              {/* Radial visually styled meters / Readiness Checklist */}
              <div className="grid sm:grid-cols-3 gap-6">
                
                {/* Visual score card */}
                <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col justify-between border border-slate-950/40 relative">
                  <div className="absolute top-2 right-2 p-1 bg-white/15 rounded-full">
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Readiness Score</h4>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="font-mono text-4xl font-extrabold text-emerald-400">{readinessData.score}</span>
                      <span className="text-slate-400 text-xs">/ 100</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-4 leading-relaxed">
                    Based on algorithmic assessment weights mapping your informational coverage indices.
                  </p>
                </div>

                {/* Checklist column */}
                <div className="sm:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Diagnostic Checklist</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] font-semibold leading-relaxed">
                    {readinessData.checklist.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        {item.ok ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0"></span>
                        )}
                        <span className={item.ok ? 'text-slate-800' : 'text-slate-400 font-medium'}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Match Score & ATS optimizers */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-emerald-500" />
                    ATS Optimization & Resume Alignments
                  </h3>
                  <button
                    onClick={handleFetchMatchScore}
                    disabled={matchLoading}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {matchLoading ? 'Analyzing...' : 'Fetch ATS Compatibility'}
                  </button>
                </div>

                {matchResult ? (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                      <div className="text-3xl font-mono font-extrabold text-emerald-700">{matchResult.score}%</div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-emerald-800 uppercase tracking-wide text-[9px]">Calculated Match Alignment</div>
                        <p className="text-emerald-700 leading-tight pr-4">{matchResult.executiveSummary}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Left: Missing tags */}
                      <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-xl space-y-2">
                        <h4 className="font-bold text-red-700 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" /> Missing Keywords / Gap Nodes
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {matchResult.missingKeywords.length === 0 ? (
                            <span className="text-slate-400 font-medium italic">No critical content gaps tracked.</span>
                          ) : (
                            matchResult.missingKeywords.map(tags => (
                              <span key={tags} className="px-2 py-0.5 text-[9px] font-mono font-bold bg-rose-100/60 text-rose-800 border border-rose-200/50 rounded-sm">
                                {tags}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Structural advice */}
                      <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-xl space-y-2">
                        <h4 className="font-bold text-sky-800 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <BadgeInfo className="h-3.5 w-3.5" /> Resume Customizations
                        </h4>
                        <ul className="space-y-1 text-slate-600 list-disc pl-3 text-[11px] leading-tight">
                          {matchResult.tips.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center font-medium py-6 text-slate-400 text-xs">
                    Use the optimizer tool to gauge CV compatibility with JD. Note: Paste experiences in Settings first.
                  </div>
                )}
              </div>

              {/* Tailored cover outreach assistant */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Tailored Copywriting engine</h3>
                    <p className="text-[10px] text-slate-400 leading-none mt-1">Select formats and draft high-converting documents instantly.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={aiDocType}
                      onChange={(e) => setAiDocType(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <option value="cover_letter">Draft Cover Letter</option>
                      <option value="linkedin_outreach">Draft LinkedIn Contact</option>
                    </select>

                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={aiLoading}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {aiLoading ? 'Drafting...' : 'Deploy AI Writer'}
                    </button>
                  </div>
                </div>

                {/* Output sheet and details */}
                {aiOutput ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-200 p-2 rounded-lg font-mono text-[10px] text-slate-600 font-bold px-4">
                      <span>DRAFT OUTPUT COPY:</span>
                      <button
                        onClick={handleCopyClipboard}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-md border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {aiCopied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {aiCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 bg-white border rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans overflow-x-auto max-h-[300px]">
                      {aiOutput}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8 text-xs">
                    No copied formats synthesized. Click draft above to formulate custom copy documents.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
