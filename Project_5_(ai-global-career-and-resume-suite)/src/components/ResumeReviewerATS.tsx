import { useState } from "react";
import { FileCheck, BookOpen, Trophy, Sparkles, CheckSquare, Square, Download, Copy, Check, RefreshCw, AlertCircle, Edit } from "lucide-react";
import { ResumeInputArea } from "./ResumeInputArea";
import { downloadAsPdf, downloadAsMd, downloadAsDocx, copyToClipboard } from "../utils/downloadHelper";
import { AtsPureReviewData } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ResumeReviewerATSProps {
  theme: "light" | "dark";
}

export function ResumeReviewerATS({ theme }: ResumeReviewerATSProps) {
  const [resumeText, setResumeText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AtsPureReviewData | null>(null);

  // Selector checks to embed modifications
  const [embedContactFixes, setEmbedContactFixes] = useState(true);
  const [embedVerbPowerPoints, setEmbedVerbPowerPoints] = useState(true);
  const [embedAtsStructure, setEmbedAtsStructure] = useState(true);

  // Output Editable Resume
  const [finalizedResume, setFinalizedResume] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // Tab panels
  const [activeTab, setActiveTab] = useState<"audit" | "ats-builder">("audit");

  const handleResumeContent = (text: string, filename: string) => {
    setResumeText(text);
    setSourceName(filename);
    setData(null);
    setError("");
    setFinalizedResume("");
  };

  const handleAtsVerify = async () => {
    if (!resumeText) {
      setError("Please load or paste your resume first.");
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
      const response = await fetch("/api/review-resume-ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeText, 
          userName: getLoggedInUserName() 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate ATS metrics.");
      }

      const result: AtsPureReviewData = await response.json();
      setData(result);
      setFinalizedResume(result.generatedResume);
      setActiveTab("audit");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during direct ATS compilation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!data) return;
    let resumeDraft = data.generatedResume;

    if (!embedContactFixes) {
      resumeDraft = resumeDraft.replace(/1\.\s+Contact\s+Information\s+[\s\S]*?\n\n2\./, "1. Contact Information (Default Bypassed)\n\n2.");
    }
    if (!embedVerbPowerPoints) {
      resumeDraft = resumeDraft.replace(/Delivered /g, "Involved in ");
      resumeDraft = resumeDraft.replace(/Optimized /g, "Supported ");
    }
    if (!embedAtsStructure) {
      // Revert back or strip strict margins
      resumeDraft = "=== CUSTOM REVERTED BORDERS ===\n" + resumeDraft;
    }

    setFinalizedResume(resumeDraft);
    setActiveTab("ats-builder");
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(finalizedResume);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = (format: "pdf" | "md" | "docx") => {
    const filename = `ATS_Score_Compatible_Resume`;
    const docTitle = "ATS Score Reworked Compatible Resume";

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
            <FileCheck className="w-5 h-5 text-emerald-500" />
            Resume Reviewer As Per ATS
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Directly test your resume's general design, content, grammar formats, and impact against strict standard ATS scanners without needing a specific JD.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-4 space-y-4">
          <ResumeInputArea title="Attach Resume" onContentReady={handleResumeContent} theme={theme} />

          {resumeText && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
              } space-y-4`}
            >
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-mono">
                🔍 Target: {sourceName}
              </div>

              <button
                disabled={isLoading}
                onClick={handleAtsVerify}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? "Running Structural Scoring..." : "Evaluate ATS Compatibility"}
              </button>
            </motion.div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Right Viewport Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-12 text-center flex flex-col items-center justify-center min-h-[350px] ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}
              >
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/25 border-t-emerald-500 animate-spin mb-4"></div>
                <h3 className="text-sm font-bold tracking-tight mb-1 text-emerald-500 animate-pulse">
                  Computing ATS Layout & Grammar Metrics
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Evaluating font systems readability, validating action verbs impact, analyzing syntactic errors, and drafting an ATS-safe layout...
                </p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Score Grid Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className={`p-3 rounded-xl border text-center ${theme === "dark" ? "bg-slate-950 border-slate-850" : "bg-slate-50 border-slate-200"}`}>
                    <div className="text-[10px] text-slate-500 font-extrabold uppercase">Overall</div>
                    <div className="text-2xl font-black text-emerald-500 font-mono my-0.5">{data.scores.overall}/10</div>
                    <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded px-1">Audited</div>
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

                {/* Detailed evaluation audit */}
                <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"}`}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    Detailed ATS Score Layout Feedback
                  </h3>
                  <div className="text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-line font-semibold border-t border-slate-800/15 pt-3">
                    {data.feedbackMarkdown}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-12 text-center min-h-[350px] flex flex-col items-center justify-center ${
                  theme === "dark" ? "bg-slate-900/10 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}
              >
                <FileCheck className={`w-12 h-12 mb-4 animate-pulse ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className="text-sm font-bold tracking-tight text-slate-400">ATS Audit Panel Idle</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Feed in your resume draft to process overall compliance audit and convert it to full strict formats natively using Gemini.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
