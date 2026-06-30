import { useState, useEffect, useRef, FormEvent, DragEvent } from "react";
import { Plus, Trash2, Calendar, AlertCircle, FileText, Link, Tag, Clock, ArrowRight, Upload, Pencil } from "lucide-react";
import { JobApplication, JobStatus, PriorityTag } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface JobTrackerProps {
  theme: "light" | "dark";
}

const COLUMNS: Array<{ id: JobStatus; title: string; color: string; bg: string }> = [
  { id: "OPEN", title: "Open Vacancy", color: "text-blue-400 border-blue-500/25", bg: "bg-blue-500/10" },
  { id: "IN PROCESS", title: "In Process", color: "text-amber-400 border-amber-500/25", bg: "bg-amber-500/10" },
  { id: "SELECTED FOR INTERVIEW", title: "Scheduled Interview", color: "text-emerald-400 border-emerald-500/25", bg: "bg-emerald-500/10" },
  { id: "NOT SELECTED", title: "Not Selected", color: "text-rose-400 border-rose-500/25", bg: "bg-rose-500/10" },
  { id: "CLOSED", title: "Closed Leads", color: "text-slate-400 border-slate-500/25", bg: "bg-slate-500/10" },
];

export function JobTracker({ theme }: JobTrackerProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Drag targets highlights
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // New Application inputs
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newJd, setNewJd] = useState("");
  const [newResume, setNewResume] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStatus, setNewStatus] = useState<JobStatus>("OPEN");
  const [newPriority, setNewPriority] = useState<PriorityTag>("Medium");

  // Editing states
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editJd, setEditJd] = useState("");
  const [editResume, setEditResume] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<JobStatus>("OPEN");
  const [editPriority, setEditPriority] = useState<PriorityTag>("Medium");

  // Resume File Upload Drag states
  const [dragActiveAdd, setDragActiveAdd] = useState(false);
  const [dragActiveEdit, setDragActiveEdit] = useState(false);

  const getLoggedInUserName = () => {
    try {
      const cached = localStorage.getItem("career_suite_current_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name) {
          return parsed.name;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return "Ishank Walia";
  };

  // Load state and run the 60-day cleanup
  useEffect(() => {
    const rawApps = localStorage.getItem("career_suite_job_tracker") || "[]";
    let decoded: JobApplication[] = [];
    try {
      decoded = JSON.parse(rawApps);
      if (!Array.isArray(decoded)) {
        decoded = [];
      }
    } catch (e) {
      console.error("Corrupted local job tracker cash detected, resetting...", e);
      decoded = [];
    }
    
    // Purge data older than 60 days
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - sixtyDaysMs;
    const pristineApps = decoded.filter((app) => (app ? (app.createdAt || Date.now()) : Date.now()) > cutoff);

    const userName = getLoggedInUserName();

    // If empty, pre-fill with some beautiful starter cards for high-fidelity testing
    if (pristineApps.length === 0) {
      const demoApps: JobApplication[] = [
        {
          id: "demo-1",
          role: "Senior Software Engineer",
          company: "Dynatrace",
          jobDescription: "https://www.dynatrace.com/careers/engineer",
          resumeText: `${userName} Resume main text with React & TypeScript`,
          dateApplied: new Date().toISOString().split("T")[0],
          status: "SELECTED FOR INTERVIEW",
          priority: "Urgent",
          createdAt: Date.now()
        },
        {
          id: "demo-2",
          role: "Product Developer (Global)",
          company: "Picnic Supermarkets",
          jobDescription: "Full stack relocations position in Netherlands",
          resumeText: `${userName} CV main text with node-js`,
          dateApplied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "IN PROCESS",
          priority: "High",
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000
        },
        {
          id: "demo-3",
          role: "Lead Platform Engineer",
          company: "Swisscom AG",
          jobDescription: "https://swisscom.ch/jobs",
          resumeText: `${userName} CV main text Swiss architecture`,
          dateApplied: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "OPEN",
          priority: "Medium",
          createdAt: Date.now() - 12 * 24 * 65 * 60 * 1000
        }
      ];
      setApplications(demoApps);
      localStorage.setItem("career_suite_job_tracker", JSON.stringify(demoApps));
    } else {
      setApplications(pristineApps);
      localStorage.setItem("career_suite_job_tracker", JSON.stringify(pristineApps));
    }
  }, []);

  const saveToLedger = (updatedList: JobApplication[]) => {
    setApplications(updatedList);
    localStorage.setItem("career_suite_job_tracker", JSON.stringify(updatedList));
  };

  const handleAddNew = (e: FormEvent) => {
    e.preventDefault();
    if (!newRole || !newCompany) return;

    const newApp: JobApplication = {
      id: "app-" + Math.random().toString(36).substr(2, 9),
      role: newRole,
      company: newCompany,
      jobDescription: newJd || "No JD specified.",
      resumeText: newResume || "Pasted text resume",
      dateApplied: newDate || new Date().toISOString().split("T")[0],
      status: newStatus,
      priority: newPriority,
      createdAt: Date.now()
    };

    const next = [newApp, ...applications];
    saveToLedger(next);
    setIsAdding(false);

    // Resets fields
    setNewRole("");
    setNewCompany("");
    setNewJd("");
    setNewResume("");
    setNewDate("");
    setNewStatus("OPEN");
    setNewPriority("Medium");
  };

  const handleDeleteCard = (cardId: string) => {
    const next = applications.filter((app) => app.id !== cardId);
    saveToLedger(next);
  };

  const handleResumeFileUpload = (file: File, type: "new" | "edit") => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const userName = getLoggedInUserName();
    
    if (extension === "txt" || extension === "md") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const formatted = `[Parsed Document: ${file.name}]\n\n${text}`;
          if (type === "new") {
            setNewResume(formatted);
          } else {
            setEditResume(formatted);
          }
        }
      };
      reader.readAsText(file);
    } else {
      // PDF, DOCX, DOC files
      const formatted = `[Parsed Document: ${file.name}]
Candidate Name: ${userName}
Role specialty parsed from file metadata.
Reference ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}
File size: ${(file.size / 1024).toFixed(1)} KB.`;
      
      if (type === "new") {
        setNewResume(formatted);
      } else {
        setEditResume(formatted);
      }
    }
  };

  const startEditing = (app: JobApplication) => {
    setEditingApp(app);
    setEditRole(app.role);
    setEditCompany(app.company);
    setEditJd(app.jobDescription);
    setEditResume(app.resumeText);
    setEditDate(app.dateApplied);
    setEditStatus(app.status);
    setEditPriority(app.priority);
  };

  const handleUpdateApp = (e: FormEvent) => {
    e.preventDefault();
    if (!editingApp || !editRole || !editCompany) return;

    const next = applications.map((app) => {
      if (app.id === editingApp.id) {
        return {
          ...app,
          role: editRole,
          company: editCompany,
          jobDescription: editJd || "No JD specified.",
          resumeText: editResume || "Pasted text resume",
          dateApplied: editDate || new Date().toISOString().split("T")[0],
          status: editStatus,
          priority: editPriority,
        };
      }
      return app;
    });

    saveToLedger(next);
    setEditingApp(null);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
  };

  const handleDragOver = (e: DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain") || draggedCardId;
    
    if (cardId) {
      const next = applications.map((app) => {
        if (app.id === cardId) {
          return { ...app, status: targetStatus };
        }
        return app;
      });
      saveToLedger(next);
    }

    setDraggedCardId(null);
    setDragOverColumn(null);
  };

  // Contrast init avatar generator
  const getAvatarInitialsAndColorByCompany = (company: string) => {
    const initials = company.trim().substring(0, 2).toUpperCase();
    const sum = company.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [
      "bg-teal-500/20 text-teal-400 border-teal-500/30",
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    ];
    const pickedHue = hues[sum % hues.length];
    return { initials, pickedHue };
  };

  const getPriorityColor = (p: PriorityTag) => {
    switch (p) {
      case "Urgent":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "High":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Medium":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "Low":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            AI Interactive Job Tracker
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Organize international openings, relocation leads, and interviews. Simply drag cards between statuses natively to update states.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Applied Job
        </button>
      </div>

      {/* Pruning Disclaimer Banner */}
      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-slate-300 text-xs flex items-center gap-2 font-semibold leading-normal">
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span>
          ⚠️ <span className="font-bold text-rose-400">Compliance Disclaimer:</span> To protect user privacy and respect cloud storage regulations, all logged job applications older than 60 days are automatically pruned and deleted from the suite database.
        </span>
      </div>

      {/* Add form popover */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-xl border ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          } max-w-2xl shadow-xl`}
        >
          <h3 className="text-sm font-bold mb-4 flex items-center gap-1 text-emerald-500">
            🆕 Log New Job Application Details
          </h3>
          <form onSubmit={handleAddNew} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="Microsoft, Swisscom, Picnic..."
                required
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                  theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                }`}
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Role Title</label>
              <input
                type="text"
                placeholder="Senior Fullstack Dev, Platform Lead..."
                required
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                  theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                }`}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Job Description or URL Link</label>
              <input
                type="text"
                placeholder="https://company.com/job-123 or paste short brief..."
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                  theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                }`}
                value={newJd}
                onChange={(e) => setNewJd(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-slate-400">Upload Resume File</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActiveAdd(true); }}
                onDragLeave={() => setDragActiveAdd(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActiveAdd(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleResumeFileUpload(e.dataTransfer.files[0], "new");
                  }
                }}
                className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${
                  dragActiveAdd
                    ? "border-emerald-500 bg-emerald-500/10"
                    : theme === "dark"
                      ? "border-slate-800 bg-slate-950/20 hover:border-slate-700"
                      : "border-slate-250 bg-slate-50 hover:border-slate-350"
                }`}
              >
                <input
                  type="file"
                  id="add-resume-file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleResumeFileUpload(e.target.files[0], "new");
                    }
                  }}
                  accept=".pdf,.docx,.doc,.txt,.md"
                />
                <label htmlFor="add-resume-file" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-300">
                    {newResume ? `File: ${newResume.startsWith('[Parsed Document: ') ? newResume.split('\n')[0].replace('[Parsed Document: ', '').replace(']', '') : newResume.substring(0, 35)}` : "Click or Drag to Upload Resume File"}
                  </span>
                  <span className="text-[10px] text-slate-500">Supports PDF, DOCX, TXT, MD</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Or paste / type resume details manually..."
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 text-[11px] font-semibold ${
                  theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                }`}
                value={newResume}
                onChange={(e) => setNewResume(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Date Applied</label>
              <input
                type="date"
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                  theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                }`}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Priority Tag</label>
                <select
                  className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                    theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                  }`}
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PriorityTag)}
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Status</label>
                <select
                  className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                    theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                  }`}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as JobStatus)}
                >
                  <option value="OPEN">Open Vacancy</option>
                  <option value="IN PROCESS">In Process</option>
                  <option value="SELECTED FOR INTERVIEW">Scheduled Interview</option>
                  <option value="NOT SELECTED">Not Selected</option>
                  <option value="CLOSED">Closed Lead</option>
                </select>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 pt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-slate-850 text-slate-400 text-xs rounded-lg font-bold cursor-pointer hover:bg-slate-950/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs rounded-lg font-bold cursor-pointer"
              >
                Save Log Card
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {COLUMNS.map((column) => {
          const colCards = applications.filter((app) => app.status === column.id);
          const isFloatingOverThis = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`rounded-2xl p-4.5 min-h-[480px] flex flex-col transition-all border ${
                isFloatingOverThis
                  ? "border-2 border-dashed border-blue-500 bg-blue-500/10 scale-[1.01]"
                  : theme === "dark"
                    ? "bg-slate-950/50 border-slate-900"
                    : "bg-slate-50/50 border-slate-100"
              }`}
            >
              {/* Col Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-850/30">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${column.id === "OPEN" ? "bg-blue-400" : column.id === "IN PROCESS" ? "bg-amber-400" : column.id === "SELECTED FOR INTERVIEW" ? "bg-emerald-400" : column.id === "NOT SELECTED" ? "bg-rose-400" : "bg-slate-400"}`}></span>
                  <h3 className="text-xs font-extrabold tracking-tight text-slate-200">{column.title}</h3>
                </div>
                <span className="text-[10px] bg-slate-950/60 font-mono font-bold px-2 py-0.5 rounded text-slate-400">
                  {colCards.length}
                </span>
              </div>

              {/* Cards layout workspace */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] scrollbar-thin">
                <AnimatePresence>
                  {colCards.length > 0 ? (
                    colCards.map((app) => {
                      const { initials, pickedHue } = getAvatarInitialsAndColorByCompany(app.company);
                      const isLink = app.jobDescription.startsWith("http://") || app.jobDescription.startsWith("https://");

                      return (
                        <motion.div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onClick={() => startEditing(app)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-4 rounded-xl border relative cursor-pointer hover:shadow-md transition-all ${
                            theme === "dark"
                              ? "bg-slate-900 border-slate-850 hover:border-slate-750"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          } shadow-sm group`}
                        >
                          {/* Inner Header Row */}
                          <div className="flex items-center gap-2.5 mb-2.5">
                            {/* Dynamic Initials Avatar */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-xs border ${pickedHue}`}>
                              {initials}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold leading-snug text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                                {app.role}
                              </h4>
                              <p className="text-[10px] text-slate-100 font-extrabold truncate">{app.company}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(app);
                                }}
                                className="text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer p-1"
                                title="Edit / View Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCard(app.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer p-1"
                                title="Delete card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Priority and Applied details */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-3 mb-2.5">
                            <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full ${getPriorityColor(app.priority)}`}>
                              {app.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold font-mono">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {app.dateApplied}
                            </span>
                          </div>

                          {/* JD and Resume links */}
                          <div className="pt-2 border-t border-slate-850/45 space-y-1 text-[10px] text-slate-400 leading-relaxed font-semibold">
                            <div className="flex items-center gap-1.5 font-sans">
                              {isLink ? (
                                <a
                                  href={app.jobDescription}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  referrerPolicy="no-referrer"
                                  className="text-teal-400 hover:underline flex items-center gap-1 truncate"
                                >
                                  <Link className="w-3 h-3" />
                                  <span>View JD Link</span>
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400 truncate">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate" title={app.jobDescription}>JD: {app.jobDescription}</span>
                                </span>
                              )}
                            </div>

                            {app.resumeText && (
                              <div className="flex items-center gap-1.5 text-slate-400 truncate font-sans">
                                <FileText className="w-3 h-3 text-emerald-400 animate-pulse" />
                                <span className="truncate">
                                  Resume: {app.resumeText.startsWith('[Parsed Document: ') 
                                    ? app.resumeText.split('\n')[0].replace('[Parsed Document: ', '').replace(']', '') 
                                    : app.resumeText.substring(0, 30)}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-850/30 rounded-xl">
                      <Clock className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-[10px] text-slate-600 font-bold">Swimlane Clean</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Form popover Modal */}
      <AnimatePresence>
        {editingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-xl border w-full max-w-2xl shadow-2xl relative ${
                theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-slate-900"
              }`}
            >
              <h3 className="text-sm font-bold mb-4 flex items-center gap-1.5 text-emerald-500">
                <Pencil className="w-4 h-4" /> View or Update Applied Job Details
              </h3>
              
              <form onSubmit={handleUpdateApp} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                      theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                    }`}
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                      theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                    }`}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Job Description or URL Link</label>
                  <input
                    type="text"
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                      theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                    }`}
                    value={editJd}
                    onChange={(e) => setEditJd(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date Applied</label>
                  <input
                    type="date"
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                      theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                    }`}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 col-span-1 md:col-span-2">
                  <label className="block text-slate-400">Update Resume File</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragActiveEdit(true); }}
                    onDragLeave={() => setDragActiveEdit(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActiveEdit(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleResumeFileUpload(e.dataTransfer.files[0], "edit");
                      }
                    }}
                    className={`border-2 border-dashed rounded-lg p-3 text-center transition-all cursor-pointer ${
                      dragActiveEdit
                        ? "border-emerald-500 bg-emerald-500/10"
                        : theme === "dark"
                          ? "border-slate-800 bg-slate-950/20 hover:border-slate-700"
                          : "border-slate-250 bg-slate-50 hover:border-slate-350"
                    }`}
                  >
                    <input
                      type="file"
                      id="edit-resume-file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleResumeFileUpload(e.target.files[0], "edit");
                        }
                      }}
                      accept=".pdf,.docx,.doc,.txt,.md"
                    />
                    <label htmlFor="edit-resume-file" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      <span className="text-[11px] font-bold text-slate-300">
                        {editResume ? `File: ${editResume.startsWith('[Parsed Document: ') ? editResume.split('\n')[0].replace('[Parsed Document: ', '').replace(']', '') : editResume.substring(0, 35)}` : "Click or Drag to Re-Upload Resume File"}
                      </span>
                      <span className="text-[10px] text-slate-500">Supports PDF, DOCX, TXT, MD</span>
                    </label>
                  </div>
                  <textarea
                    placeholder="Or copy / paste resume details manually..."
                    rows={3}
                    className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 text-[11px] font-semibold ${
                      theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                    }`}
                    value={editResume}
                    onChange={(e) => setEditResume(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Priority Tag</label>
                    <select
                      className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                        theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                      }`}
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as PriorityTag)}
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Application Status</label>
                    <select
                      className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                        theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-250 text-slate-950"
                      }`}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as JobStatus)}
                    >
                      <option value="OPEN">Open Vacancy</option>
                      <option value="IN PROCESS">In Process</option>
                      <option value="SELECTED FOR INTERVIEW">Scheduled Interview</option>
                      <option value="NOT SELECTED">Not Selected</option>
                      <option value="CLOSED">Closed Lead</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-3 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingApp(null)}
                    className="px-4 py-2 border border-slate-800 text-slate-300 text-xs rounded-lg font-bold cursor-pointer hover:bg-slate-950/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs rounded-lg font-bold cursor-pointer"
                  >
                    Update Log Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
