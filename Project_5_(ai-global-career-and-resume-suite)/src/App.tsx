import { useState, useEffect } from "react";
import { AuthGateway } from "./components/AuthGateway";
import { SkillFinder } from "./components/SkillFinder";
import { JobSearch } from "./components/JobSearch";
import { ResumeReviewerJD } from "./components/ResumeReviewerJD";
import { ResumeReviewerATS } from "./components/ResumeReviewerATS";
import { LettersGenerator } from "./components/LettersGenerator";
import { JobTracker } from "./components/JobTracker";
import { InterviewCheatSheet } from "./components/InterviewCheatSheet";
import { UserSession } from "./types";
import { Sun, Moon, LogOut, Briefcase, Brain, Globe, FileText, FileCheck, FileCode, Heart, MessageSquare, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [user, setUser] = useState<UserSession | null>(null);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"skills" | "search" | "review-jd" | "review-ats" | "letters" | "tracker" | "interview">("skills");

  // Sync theme with HTML document classes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Load user session on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem("career_suite_current_user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.name === "Professional Candidate") {
          parsed.name = "Ishank Walia";
          localStorage.setItem("career_suite_current_user", JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem("career_suite_current_user");
      }
    }
  }, []);

  const handleLoginSuccess = (name: string, email: string) => {
    const session: UserSession = { name, email, isLoggedIn: true };
    setUser(session);
    localStorage.setItem("career_suite_current_user", JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("career_suite_current_user");
  };

  const navItems = [
    { id: "skills", label: "Skill Finder", icon: Brain, color: "text-emerald-500" },
    { id: "search", label: "Sponsorship Search", icon: Globe, color: "text-blue-400" },
    { id: "review-jd", label: "Resume Fixer", icon: FileText, color: "text-amber-400" },
    { id: "review-ats", label: "ATS Auditor", icon: FileCheck, color: "text-teal-400" },
    { id: "letters", label: "Cover Letter Builder", icon: Heart, color: "text-rose-450" },
    { id: "tracker", label: "Status Tracker", icon: Clock, color: "text-sky-400" },
    { id: "interview", label: "First Screening Cheat Sheet", icon: MessageSquare, color: "text-indigo-400" },
  ] as const;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      theme === "dark" 
        ? "bg-slate-950 text-slate-200" 
        : "bg-slate-50 text-slate-900"
    }`}>
      {/* Dynamic Background Noise/Glow Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!user ? (
          <AuthGateway onLoginSuccess={handleLoginSuccess} theme={theme} />
        ) : (
          <div className="flex h-screen overflow-hidden relative">
            {/* Left Sidebar: Main Navigation */}
            <aside className={`w-64 flex-shrink-0 border-r flex flex-col justify-between relative z-20 transition-colors duration-350 ${
              theme === "dark" 
                ? "border-slate-800 bg-slate-900/50" 
                : "bg-slate-100/95 border-slate-200"
            }`}>
              <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Brand Identity Header */}
                <div className="p-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div>
                    <span className={`text-base font-bold tracking-tight block ${theme === "dark" ? "text-white" : "text-slate-950"}`}>JobSphere AI</span>
                    <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest block -mt-1 font-mono">CAREER COMMAND</span>
                  </div>
                </div>

                {/* Sidebar Navigation items */}
                <nav className="flex-1 px-4 space-y-1.5 py-4">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border text-left ${
                          isActive
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-bold"
                            : theme === "dark"
                              ? "border-transparent text-slate-400 hover:bg-slate-950 hover:text-slate-100"
                              : "border-transparent text-slate-600 hover:bg-slate-200/60 hover:text-slate-950"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : item.color}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer with Premium Status */}
              <div className={`p-4 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 p-4 rounded-2xl relative overflow-hidden shadow-md">
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest mb-1">Account Status</p>
                    <p className="text-xs font-bold text-white">Premium AI Member</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                </div>
              </div>
            </aside>

            {/* Main Workspace Frame */}
            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
              {/* Workspace Header Bar */}
              <header className={`h-16 border-b flex-shrink-0 flex items-center justify-between px-8 relative z-20 ${
                theme === "dark" ? "border-slate-800 bg-slate-900/30" : "bg-white/80 border-slate-200"
              }`}>
                <div className="flex items-center gap-4">
                  <h2 className={`text-base font-extrabold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Career Command Center</h2>
                  <div className={`h-4 w-px ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}></div>
                  <p className={`text-xs hidden sm:block ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Welcome back, <span className="text-cyan-400 font-bold">{user.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Theme toggler widget */}
                  <div className={`flex p-1 rounded-full border ${theme === "dark" ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-1.5 rounded-full transition-all cursor-pointer ${
                        theme === "dark" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="Activate Dark Cyber mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-1.5 rounded-full transition-all cursor-pointer ${
                        theme === "light" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-300"
                      }`}
                      title="Activate High Contrast Light mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Separator */}
                  <div className={`h-5 w-px ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}></div>

                  {/* Profile & Logout Action */}
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className={`text-xs font-bold leading-none ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{user.name}</p>
                      <p className={`text-[10px] ${theme === "dark" ? "text-slate-400 font-mono" : "text-slate-500"} mt-0.5 max-w-[150px] truncate`}>{user.email}</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        theme === "dark"
                          ? "bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-rose-650"
                      }`}
                      title="Sign Out of Session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Dynamic Scrolling Board Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {/* Dashboard Welcome Banner */}
                <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
                  theme === "dark"
                    ? "bg-slate-900/40 border-slate-800/80 shadow-lg shadow-slate-950/20"
                    : "bg-white border-slate-200 shadow-sm shadow-slate-100"
                }`}>
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <Briefcase className="w-32 h-32 text-cyan-400" />
                  </div>

                  <div className="relative">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                      Active Professional Workspace
                    </span>
                    <h2 className={`text-xl font-bold mt-2.5 tracking-tight ${theme === "dark" ? "text-white" : "text-slate-950"}`}>
                      Welcome back, {user.name}! 🚀
                    </h2>
                    <p className={`text-xs mt-1.5 max-w-2xl leading-relaxed ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      Your global career dossier is synchronized. Use the navigation sidebar to optimize multi-regional CV formatting, analyze target descriptions, coordinate corporate relocations, and practice mock screenings.
                    </p>
                  </div>
                </div>

                {/* Main Feature Component Host loaded dynamically */}
                <div className="min-h-[500px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      {activeTab === "skills" && <SkillFinder theme={theme} />}
                      {activeTab === "search" && <JobSearch theme={theme} />}
                      {activeTab === "review-jd" && <ResumeReviewerJD theme={theme} />}
                      {activeTab === "review-ats" && <ResumeReviewerATS theme={theme} />}
                      {activeTab === "letters" && <LettersGenerator theme={theme} />}
                      {activeTab === "tracker" && <JobTracker theme={theme} />}
                      {activeTab === "interview" && <InterviewCheatSheet theme={theme} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Clean inline footer below active content */}
                <footer className={`pt-12 pb-6 border-t text-center ${
                  theme === "dark" ? "border-slate-900" : "border-slate-200"
                }`}>
                  <p className="text-[10px] text-slate-500 font-mono font-medium">
                    AI Global Career Suite • Compliant with 60-day regional privacy retention schemes • Powered by Antigravity Core
                  </p>
                </footer>
              </div>
            </main>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
