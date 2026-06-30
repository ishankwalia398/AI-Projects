import { useState } from "react";
import { FileText, Briefcase, HelpCircle, Trophy, Edit3, Download, Sparkles, Check, CheckSquare, Square, RefreshCw, AlertCircle, Bookmark } from "lucide-react";
import { ResumeInputArea } from "./ResumeInputArea";
import { downloadAsPdf, downloadAsMd, downloadAsDocx, copyToClipboard } from "../utils/downloadHelper";
import { ResumeReviewData } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ResumeReviewerJDProps {
  theme: "light" | "dark";
}

const parseResumeSections = (text: string) => {
  const sections: Record<string, string> = {
    contact: "",
    summary: "",
    experience: "",
    skills: "",
    education: "",
    certs: "",
    addons: ""
  };

  const lines = text.split(/\r?\n/);
  let currentSection = "contact";
  const sectionContent: Record<string, string[]> = {
    contact: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    certs: [],
    addons: []
  };

  const isSummaryHeader = (line: string) => {
    const l = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (l.length > 40) return false;
    return l === "summary" || l.includes("summary of") || l.includes("professional summary") || l.includes("executive summary") || l === "profile" || l.includes("professional profile") || l === "about me" || l === "objective" || l === "about" || l.includes("headline") || l.includes("career summary");
  };

  const isExperienceHeader = (line: string) => {
    const l = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (l.length > 40) return false;
    return l.includes("experience") || l.includes("employment") || l.includes("work history") || l.includes("career history") || l.includes("professional history") || l === "work experience" || l === "relevant experience";
  };

  const isSkillsHeader = (line: string) => {
    const l = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (l.length > 40) return false;
    return l.includes("skills") || l.includes("competencies") || l.includes("technologies") || l.includes("expertise") || l.includes("areas of strength") || l.includes("tools") || l.includes("proficiencies");
  };

  const isEducationHeader = (line: string) => {
    const l = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (l.length > 40) return false;
    return l === "education" || l.includes("academic") || l.includes("credentials") || l.includes("degrees");
  };

  const isCertsHeader = (line: string) => {
    const l = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
    if (l.length > 40) return false;
    return l.includes("certifications") || l.includes("certificates") || l.includes("training") || l.includes("credentials");
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cleanLine = line.replace(/^[0-9.#\-\s*]+\s*/, "");
    if (isSummaryHeader(cleanLine)) {
      currentSection = "summary";
    } else if (isExperienceHeader(cleanLine)) {
      currentSection = "experience";
    } else if (isSkillsHeader(cleanLine)) {
      currentSection = "skills";
    } else if (isEducationHeader(cleanLine)) {
      currentSection = "education";
    } else if (isCertsHeader(cleanLine)) {
      currentSection = "certs";
    } else if (cleanLine.toLowerCase() === "optional add-ons" || cleanLine.toLowerCase().includes("add-ons") || cleanLine.toLowerCase() === "projects") {
      currentSection = "addons";
    } else {
      sectionContent[currentSection].push(lines[i]);
    }
  }

  Object.keys(sectionContent).forEach(key => {
    sections[key] = sectionContent[key].join("\n").trim();
  });

  return sections;
};

export function ResumeReviewerJD({ theme }: ResumeReviewerJDProps) {
  const [resumeText, setResumeText] = useState("");
  const [resumeSource, setResumeSource] = useState("");
  const [jdText, setJdText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResumeReviewData | null>(null);

  // Embedding Options states
  const [embedSummary, setEmbedSummary] = useState(true);
  const [embedKeywords, setEmbedKeywords] = useState(true);
  const [embedImpactPoints, setEmbedImpactPoints] = useState(true);
  
  // Finalized Resume (Editable)
  const [finalizedResume, setFinalizedResume] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Active Tab for Results
  const [activeTab, setActiveTab] = useState<"analysis" | "ats-editor">("analysis");

  const handleResumeContent = (text: string, filename: string) => {
    setResumeText(text);
    setResumeSource(filename);
    setData(null);
    setError("");
    setFinalizedResume("");
  };

  const handleReview = async () => {
    if (!resumeText) {
      setError("Please load or paste your resume text first.");
      return;
    }
    if (!jdText.trim()) {
      setError("Please paste the job description or provide the JD text.");
      return;
    }

    const getLoggedInUserName = () => {
      try {
        const cached = localStorage.getItem("career_suite_current_user");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name) return parsed.name;
        }
      } catch (e) {}
      return "Ishank Walia";
    };

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/review-resume-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeText, 
          jobDescription: jdText, 
          userName: getLoggedInUserName() 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile analysis review from ATS database.");
      }

      const result: ResumeReviewData = await response.json();
      setData(result);
      setFinalizedResume(result.generatedResume);
      // default tabs resets
      setActiveTab("analysis");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during resume review.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically compute the modified resume if they select or unselect options!
  const applySelectiveChanges = () => {
    if (!data) return;
    
    const origSec = parseResumeSections(resumeText);
    const aiSec = parseResumeSections(data.generatedResume);
    
    // 1. Professional Summary relocation check
    let summary = aiSec.summary || origSec.summary;
    if (!embedSummary) {
      summary = summary.replace(/\s*open\s*to\s*relocation\.?/i, "").trim();
    } else {
      if (!summary.toLowerCase().includes("open to relocation")) {
        summary = summary.endsWith(".") ? `${summary} Open to relocation.` : `${summary}. Open to relocation.`;
      }
    }
    
    // 2. Technical Skills check
    const skills = embedKeywords ? (aiSec.skills || origSec.skills) : origSec.skills;
    
    // 3. Experience check
    const experience = embedImpactPoints ? (aiSec.experience || origSec.experience) : origSec.experience;
    
    const contact = aiSec.contact || origSec.contact;
    const education = aiSec.education || origSec.education;
    const certs = aiSec.certs || origSec.certs;
    const addons = aiSec.addons || origSec.addons;
    
    let text = "";
    if (contact) text += `1. Contact Information\n${contact}\n\n`;
    if (summary) text += `2. Professional Summary\n${summary}\n\n`;
    if (experience) text += `3. Work Experience\n${experience}\n\n`;
    if (skills) text += `4. Skills\n${skills}\n\n`;
    if (education) text += `5. Education\n${education}\n\n`;
    if (certs) text += `6. Certifications & Training\n${certs}\n\n`;
    if (addons) text += `7. Optional Add-ons\n${addons}\n\n`;

    setFinalizedResume(text.trim());
    setActiveTab("ats-editor");
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(finalizedResume);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = (format: "pdf" | "md" | "docx") => {
    const filename = "ATS_Optimized_Resume";
    const docTitle = "ATS Optimized Tailored Resume";

    if (format === "pdf") {
      downloadAsPdf(filename, docTitle, finalizedResume);
    } else if (format === "md") {
      downloadAsMd(filename, finalizedResume);
    } else {
      downloadAsDocx(filename, finalizedResume);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-500" />
            Resume Fixer
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Upload your resume, paste your target Job Description, and let Gemini review matching relevance, calculate keyword density, and rewrite it for ATS.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-4 space-y-4">
          <ResumeInputArea title="Attach Resume" onContentReady={handleResumeContent} theme={theme} />

          {/* Job Description */}
          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"} space-y-4`}>
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Paste Job Description
            </h2>
            <textarea
              placeholder="Paste full Job Description containing roles, titles, location details, responsibilities, technical requirements..."
              rows={5}
              className={`w-full p-3 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                theme === "dark"
                  ? "bg-slate-950 border-slate-850 text-slate-100 focus:border-teal-500"
                  : "bg-slate-50 border-slate-200 text-slate-950 focus:border-teal-500"
              }`}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />

            {resumeText && jdText && (
              <button
                disabled={isLoading}
                onClick={handleReview}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? "Analyzing Alignment..." : "Run Jobalytics Match Review"}
              </button>
            )}

            {error && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Analysis Viewport & Embed Controls */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-12 text-center flex flex-col items-center justify-center min-h-[350px] ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}
              >
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/25 border-t-emerald-500 animate-spin mb-4"></div>
                <h3 className="text-sm font-bold tracking-tight mb-1 text-emerald-500 animate-pulse">
                  Evaluating Compatibility against ATS Core Databases
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Re-organizing job titles, studying keyword density, tracking logical inconsistencies, and restructuring your profile in real-time. Please stay with us!
                </p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="results-review"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Embedded Switch tabs list */}
                <div className="flex border-b border-slate-800/10">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`pb-2.5 px-4 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                      activeTab === "analysis"
                        ? "border-emerald-500 text-emerald-500"
                        : "border-transparent text-slate-400 hover:text-slate-350"
                    }`}
                  >
                    1. Jobalytics Score & Keyword Gap Review
                  </button>
                  <button
                    onClick={() => setActiveTab("ats-editor")}
                    className={`pb-2.5 px-4 text-xs font-bold tracking-wide border-b-2 transition-all cursor-pointer ${
                      activeTab === "ats-editor"
                        ? "border-emerald-500 text-emerald-500"
                        : "border-transparent text-slate-400 hover:text-slate-350"
                    }`}
                  >
                    2. ATS Optimized Generated Resume
                  </button>
                </div>

                {activeTab === "analysis" && (
                  <div className="space-y-6">
                    {/* Scores Metrics Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Overall</div>
                        <div className="text-2xl font-black text-emerald-500 font-mono my-0.5">{data.scores.overall}/10</div>
                        <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded px-1">Approved</div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Effectivity</div>
                        <div className="text-xl font-bold text-slate-100 font-mono my-0.5">{data.scores.effectivity.score}/10</div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Layout</div>
                        <div className="text-xl font-bold text-slate-100 font-mono my-0.5">{data.scores.layout.score}/10</div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Relevance</div>
                        <div className="text-xl font-bold text-slate-100 font-mono my-0.5">{data.scores.relevance.score}/10</div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Grammar</div>
                        <div className="text-xl font-bold text-slate-100 font-mono my-0.5">{data.scores.grammar.score}/10</div>
                      </div>
                      <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase">Impact</div>
                        <div className="text-xl font-bold text-slate-100 font-mono my-0.5">{data.scores.impact.score}/10</div>
                      </div>
                    </div>

                    {/* Keywords Gaps list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                        <h4 className="text-xs font-extrabold uppercase text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Keywords Handled Successfully
                        </h4>
                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                          {data.keywordGaps.matching.length > 0 ? (
                            data.keywordGaps.matching.map((kw, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">No exact matches yet</span>
                          )}
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                        <h4 className="text-xs font-extrabold uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                          ⚠️ Critical Missing Keyword Gaps (ATS flagged)
                        </h4>
                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto">
                          {data.keywordGaps.missing.length > 0 ? (
                            data.keywordGaps.missing.map((kw, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-teal-400 font-bold bg-teal-500/5 px-2 py-1 rounded">✅ Amazing compatibility! No gaps detected.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed feedback markdown */}
                    <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"}`}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-500" />
                        Comprehensive Jobalytics Alignment Audit Feedback
                      </h3>
                      <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-medium border-t border-slate-850 pt-3">
                        {data.feedbackMarkdown}
                      </div>

                      {/* Prompt User to tailors and embed */}
                      <div className="mt-6 p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-teal-400">Fix ATS Gaps & Incorporate Changes</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Selective changes: tick AI enhancements to inject inside your resume final draft.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("ats-editor")}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow"
                        >
                          Customize & Embed Rework <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "ats-editor" && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Selective embedding controls */}
                    <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} space-y-3`}>
                      <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                        Select Selective Changes to Embed:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          onClick={() => setEmbedSummary(!embedSummary)}
                          className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                            embedSummary
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                              : "bg-slate-950/20 border-slate-850 text-slate-400"
                          }`}
                        >
                          {embedSummary ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          Summary relocation line
                        </button>

                        <button
                          onClick={() => setEmbedKeywords(!embedKeywords)}
                          className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                            embedKeywords
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                              : "bg-slate-950/20 border-slate-850 text-slate-400"
                          }`}
                        >
                          {embedKeywords ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          Inject missing keywords
                        </button>

                        <button
                          onClick={() => setEmbedImpactPoints(!embedImpactPoints)}
                          className={`p-3 rounded-lg border text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                            embedImpactPoints
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                              : "bg-slate-950/20 border-slate-850 text-slate-400"
                          }`}
                        >
                          {embedImpactPoints ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          Incorporate metrics impact
                        </button>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={applySelectiveChanges}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs tracking-wide rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow"
                        >
                          Apply Filters & Update Draft <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Finalized ATS-Compatible text-area */}
                    <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-850" : "bg-white border-slate-250"} space-y-4`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/10">
                        <div>
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Bookmark className="w-4 h-4 text-emerald-400" />
                            Finalized ATS-Friendly Professional Resume Draft
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-850 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                            {isCopied ? "Copied!" : "Copy Text"}
                          </button>
                          <button
                            onClick={() => handleDownload("pdf")}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                          <button
                            onClick={() => handleDownload("md")}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-850 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            Markdown
                          </button>
                          <button
                            onClick={() => handleDownload("docx")}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-850 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            Word
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={18}
                        className={`w-full p-4 rounded-lg text-xs leading-relaxed font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                          theme === "dark" ? "bg-slate-950 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-950"
                        }`}
                        value={finalizedResume}
                        onChange={(e) => setFinalizedResume(e.target.value)}
                      />

                      <div className="p-3 bg-slate-950/40 rounded text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>
                          The workspace acts as an active humanizer. You can edit, tweak, or fully expand directly in the compiler workspace above. Click the primary Download PDF or Microsoft Word targets to acquire a formatted, ATS-compliant master.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty-review"
                tabIndex={0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-12 text-center min-h-[350px] flex flex-col items-center justify-center ${
                  theme === "dark" ? "bg-slate-900/10 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}
              >
                <FileText className={`w-12 h-12 mb-4 animate-bounce ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className="text-sm font-bold tracking-tight text-slate-400">Tailoring Workspace Idle</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload your CV in part 1 and paste the description in part 2 to run a complete verification. The systems checks keywords matching, computes scores, and outputs a clean ATS resume.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
