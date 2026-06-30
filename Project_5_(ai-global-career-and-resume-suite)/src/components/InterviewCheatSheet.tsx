import { useState } from "react";
import { Sparkles, FileText, Download, Copy, Check, MessageSquare, Briefcase, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ResumeInputArea } from "./ResumeInputArea";
import { downloadAsPdf, downloadAsMd, downloadAsDocx, copyToClipboard } from "../utils/downloadHelper";
import { InterviewCheatSheetData } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface InterviewCheatSheetProps {
  theme: "light" | "dark";
}

export function InterviewCheatSheet({ theme }: InterviewCheatSheetProps) {
  const [resumeText, setResumeText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [jdText, setJdText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<InterviewCheatSheetData | null>(null);
  
  const [isCopied, setIsCopied] = useState(false);

  const handleResumeContent = (text: string, filename: string) => {
    setResumeText(text);
    setSourceName(filename);
    setData(null);
    setError("");
  };

  const handleCompileSheet = async () => {
    if (!resumeText) {
      setError("Please supply a resume first.");
      return;
    }
    if (!jdText.trim()) {
      setError("Please paste the target Position/Job Description.");
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
    setData(null);
    try {
      const response = await fetch("/api/generate-cheatsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeText, 
          jobDescription: jdText, 
          userName: getLoggedInUserName() 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile screening answer sheet.");
      }

      const result: InterviewCheatSheetData = await response.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during interview sheet generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const constructPlainSheetText = () => {
    if (!data) return "";
    
    return `# SCREENING INTERVIEW CHEAT SHEET & COGNITIVE PLAYBOOK

| Question | Candidate Response / Strategy Pitch |
|---|---|
| **Question 1: Tell me about yourself** | ${data.q1Answer.replace(/\n/g, "<br/>")} |
| **Question 2: Why do you want to work with us?** | ${data.q2Answer.replace(/\n/g, "<br/>")} |
| **Question 3: Notice Period Pitch** | ${data.q3Answer.replace(/\n/g, "<br/>")} |
| **Question 4: Salary Expectation Formula** | ${data.q4Answer.replace(/\n/g, "<br/>")} |
| **Question 5: Smart Questions to Leave an Impression** | ${data.q5Questions.replace(/\n/g, "<br/>")} |
`;
  };

  const handleCopy = async () => {
    const rawText = constructPlainSheetText();
    const success = await copyToClipboard(rawText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = (format: "pdf" | "md" | "docx") => {
    if (!data) return;
    const bodyText = constructPlainSheetText();
    const filename = `Interview_Screening_Cheat_Sheet`;
    const docTitle = "Expert Screening Interview Cheat Sheet";

    if (format === "pdf") {
      downloadAsPdf(filename, docTitle, bodyText);
    } else if (format === "md") {
      downloadAsMd(filename, bodyText);
    } else {
      downloadAsDocx(filename, bodyText);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            First Screening Cheat Sheet
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Generate highly-personalized, structured responses matching executive screening templates for classic questions (Tell me about yourself, Why us, Notice, Salary, Closing).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs panel */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <ResumeInputArea title="1. Attach Resume" onContentReady={handleResumeContent} theme={theme} />

          <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"} space-y-4`}>
            <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              2. Paste Job Description
            </h2>
            <textarea
              placeholder="Paste full Job Description containing Job Title, Company name, and required responsibilities..."
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
                onClick={handleCompileSheet}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? "Compiling Playbook..." : "Compile Smart Cheat Sheet"}
              </button>
            )}

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Outputs panel */}
        <div className="col-span-1 lg:col-span-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-sheet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-12 text-center flex flex-col items-center justify-center min-h-[350px] ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}
              >
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/25 border-t-emerald-500 animate-spin mb-4"></div>
                <h3 className="text-sm font-bold tracking-tight mb-1 text-emerald-500 animate-pulse">
                  Restructuring Professional Screening Answers
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Parsing job descriptions, mapping relative skills timelines, writing natural phrasing alignments, and tailoring interview closures...
                </p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="results-sheet"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Master Export Header banner */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <div className="text-xs font-semibold text-slate-400">
                    <span className="font-bold text-emerald-500 mr-2">Screening Response Sheet Built</span>
                    <span>• 4 Key questions answered + 5 Manager Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-slate-950 text-slate-300 border border-slate-850 hover:bg-slate-800 transition-colors rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? "Copied!" : "Copy Sheet"}
                    </button>
                    <button
                      onClick={() => handleDownload("pdf")}
                      className="px-3 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-600 transition-colors rounded text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => handleDownload("md")}
                      className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-850 transition-colors rounded text-xs font-bold cursor-pointer"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => handleDownload("docx")}
                      className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-850 transition-colors rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Word
                    </button>
                  </div>
                </div>

                {/* Classic Screening Bento layout */}
                <div className="grid grid-cols-1 gap-5">
                  {/* Tell me about yourself */}
                  <div className={`p-5 rounded-xl border ${
                    theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  }`}>
                    <h3 className="text-xs font-black uppercase text-teal-400 tracking-wider mb-2.5 flex items-center gap-1">
                      🗣️ Question 1: Tell Me About Yourself
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line bg-slate-950/20 p-3.5 rounded-lg border border-slate-850/30">
                      {data.q1Answer}
                    </p>
                  </div>

                  {/* Why Company */}
                  <div className={`p-5 rounded-xl border ${
                    theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  }`}>
                    <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider mb-2.5 flex items-center gap-1">
                      🏢 Question 2: Why do you want to work with us?
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line bg-slate-950/20 p-3.5 rounded-lg border border-slate-850/30">
                      {data.q2Answer}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Notice Period */}
                    <div className={`p-5 rounded-xl border ${
                      theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                    }`}>
                      <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider mb-2.5 flex items-center gap-1">
                        ⏳ Question 3: Notice Period Pitch
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed font-semibold leading-normal">
                        {data.q3Answer}
                      </p>
                    </div>

                    {/* Salary Expectation */}
                    <div className={`p-5 rounded-xl border ${
                      theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                    }`}>
                      <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider mb-2.5 flex items-center gap-1">
                        💸 Question 4: Salary Expectation Formula
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed font-semibold leading-normal">
                        {data.q4Answer}
                      </p>
                    </div>
                  </div>

                  {/* Q5 Thoughtful Manager Follow-ups */}
                  <div className={`p-5 rounded-xl border ${
                    theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                  }`}>
                    <h3 className="text-xs font-black uppercase text-pink-400 tracking-wider mb-2.5 flex items-center gap-1">
                      🙋‍♀️ Question 5: Smart Questions To Leave An Outstanding Impression
                    </h3>
                    <div className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line bg-slate-950/20 p-4 rounded-lg border border-slate-850/30">
                      {data.q5Questions}
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty-sheet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-12 text-center min-h-[350px] flex flex-col items-center justify-center ${
                  theme === "dark" ? "bg-slate-900/10 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}
              >
                <HelpCircle className={`w-12 h-12 mb-4 animate-bounce ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className="text-sm font-bold tracking-tight text-slate-400">Speaker Notes Workspace Idle</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Feed in your resume draft to align standard screening answers to classic HR questions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
