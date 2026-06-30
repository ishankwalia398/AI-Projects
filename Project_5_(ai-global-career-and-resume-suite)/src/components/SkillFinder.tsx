import { useState } from "react";
import { Sparkles, Brain, Globe, Shield, Trophy, Layout, Download, FileDown, CheckCircle, RefreshCw } from "lucide-react";
import { ResumeInputArea } from "./ResumeInputArea";
import { downloadAsPdf, downloadAsMd, downloadAsDocx } from "../utils/downloadHelper";
import { SkillFinderData } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SkillFinderProps {
  theme: "light" | "dark";
}

export function SkillFinder({ theme }: SkillFinderProps) {
  const [resumeText, setResumeText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SkillFinderData | null>(null);

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

  const handleResumeContent = (text: string, filename: string) => {
    setResumeText(text);
    setSourceName(filename);
    setData(null);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!resumeText) {
      setError("Please upload or paste your resume text first.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, userName: getLoggedInUserName() }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze resume with AI.");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDossier = (format: "pdf" | "md" | "docx") => {
    if (!data) return;

    const exportTitle = `Global Career Intelligence - ${getLoggedInUserName()}`;
    const formattedContent = `
# GLOBAL CAREER DOSSIER & AI INTEGRATION PLAN

| Profile Details | Values |
|---|---|
| Candidate Name | ${getLoggedInUserName()} |
| Extracted Current Role | ${data.role} |
| Years of Experience | ${data.yearsOfExperience} |
| Base Location | India |

## STATEMENT OF KNOWLEDGE

| Skills Extracted |
|---|
| ${data.skillsExtracted.join(", ")} |

| Certifications Extracted |
|---|
| ${data.certificationsExtracted.length > 0 ? data.certificationsExtracted.join(", ") : "None detected"} |

## Information : TOP DEMAND METRICS (EU/APAC/US/EMEA/Middle East/CANADA)

### Top 20 Critical Job Keywords for "${data.role}" & 20 Common Job Advertiser Titles:
| Rank | Critical Keyword | Standard Job Advertiser Title |
|---|---|---|
${data.top20Keywords.map((k, idx) => `| ${idx + 1} | ${k} | ${data.commonJobTitles20[idx] || ""} |`).join("\n")}

### 5 Highest-Paid Certifications in Track:
| Rank | Certification Name | Average Pay |
|---|---|---|
${data.highestPaidCertifications5.map((c, idx) => `| ${idx + 1} | ${c.name} | ${c.averagePay} |`).join("\n")}

## Information : INTERNATIONAL MARKET OPPORTUNITIES

### Top 6 Active Countries Hiring in Track (Open to Indian Candidates):
| Country | Region Group | Open to Indians? | Average Visa Processing Time |
|---|---|---|---|
${data.top6Countries.map((c) => `| ${c.country} | ${c.region} | ${c.openIndians || c.openToIndians || "Yes"} | ${c.visaTime} |`).join("\n")}

## Information : AI INTEGRATION PATHWAYS

### Emerging Domain AI Threats vs Mitigation:
| Emerging AI Threat / Fear | Thrive / Mitigation Strategy |
|---|---|
${data.aiIntegration.fearsAndThrivingStrategy.map((f) => `| ${f.threat} | ${f.mitigation} |`).join("\n")}

### Relevant AI-Specific Online Courses:
| Recommended AI Online Courses |
|---|
${data.aiIntegration.courses.map((c) => `| ${c} |`).join("\n")}

### 10-Year Long-Term Strategy to Win the AI Game:
| 10-Year Long-Term Career Strategy Plan |
|---|
| ${data.aiIntegration.longTermStrategy10Years.replace(/\n/g, " ")} |
`;

    const filename = `SkillFinder_Dossier_${(data.name || "candidate").replace(/\s+/g, "_")}`;

    if (format === "pdf") {
      downloadAsPdf(filename, exportTitle, formattedContent);
    } else if (format === "md") {
      downloadAsMd(filename, formattedContent);
    } else {
      downloadAsDocx(filename, formattedContent);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-500" />
            Domain Skill Finder & AI Integrator
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Extract skills from your resume, analyze multi-region demand keywords, explore top visa-friendly tracks, and configure your AI-prepared roadmap.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - upload / parameters */}
        <div className="lg:col-span-4 space-y-4">
          <ResumeInputArea title="Attach Resume" onContentReady={handleResumeContent} theme={theme} />

          {resumeText && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                theme === "dark" ? "bg-emerald-950/15 border-emerald-500/20" : "bg-emerald-50 border-emerald-100"
              }`}
            >
              <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 mb-2">
                <CheckCircle className="w-4 h-4" />
                Resume Loaded Successfully
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono">Source: {sourceName}</p>
              <button
                disabled={isLoading}
                onClick={handleAnalyze}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? "Running AI Career Analysis..." : "Start AI Deep Analysis"}
              </button>
            </motion.div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Right column - deep results display */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-finder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-12 text-center flex flex-col items-center justify-center min-h-[350px] ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}
              >
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/25 border-t-emerald-500 animate-spin mb-4"></div>
                <h3 className="text-sm font-bold tracking-tight mb-1 animate-pulse text-emerald-500">
                  Processing Smart Domain Integration
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Gemini is digesting your resume text, mapping job directories, studying APAC/EU visa statistics, and synthesising a customized AI game-plan. Just a moment!
                </p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="results-finder"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                tabIndex={0}
                className="space-y-6"
              >
                {/* Dossier Download Actions */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                }`}>
                  <div className="text-xs">
                    <span className="font-bold text-emerald-500">AI Analysis Report Complete</span>
                    <span className="text-slate-400 ml-1.5">• Registered under {getLoggedInUserName()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDossier("pdf")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleDownloadDossier("md")}
                      className="px-3 py-1.5 rounded-lg border border-slate-850 hover:bg-slate-800/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Markdown
                    </button>
                    <button
                      onClick={() => handleDownloadDossier("docx")}
                      className="px-3 py-1.5 rounded-lg border border-slate-850 hover:bg-slate-800/10 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      MS Word
                    </button>
                  </div>
                </div>

                {/* Profile Overview Card */}
                <div className={`p-6 rounded-xl border relative overflow-hidden ${
                  theme === "dark" 
                    ? "bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800" 
                    : "bg-gradient-to-br from-white to-slate-50 border-slate-100"
                }`}>
                  <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-500 rounded-bl-xl text-[10px] font-bold uppercase tracking-widest font-mono">
                    Extracted India profile
                  </div>

                  <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2 mb-4">
                    <Trophy className="w-4.5 h-4.5" />
                    Personal Statement of Knowledge
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs font-medium">
                    <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/20">
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Applicant Name</div>
                      <div className="text-sm font-bold">{getLoggedInUserName()}</div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/20">
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Current Title / Role</div>
                      <div className="text-sm font-bold">{data.role}</div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/20">
                      <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Years of Experience</div>
                      <div className="text-sm font-bold">{data.yearsOfExperience || "6 Years"}</div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 mb-1.5">Extracted Core Competency Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {data.skillsExtracted.map((skill, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide ${
                              theme === "dark" ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {data.certificationsExtracted.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-1.5">Active Certifications Listed</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.certificationsExtracted.map((cert, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question 1: Keywords and Domain Titles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top 20 Keywords Table */}
                  <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Layout className="w-4 h-4 text-emerald-500" />
                      Top 20 Critical Job Description Keywords (EU/APAC/US/CANADA)
                    </h3>
                    <div className="overflow-y-auto max-h-[280px]">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/25">
                            <th className="py-2.5 text-slate-400 font-bold w-12 text-center">Rank</th>
                            <th className="py-2.5 text-slate-200 font-bold">Keyword / Technical Asset</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {data.top20Keywords.map((kw, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2 font-mono text-center text-slate-500 font-bold">#{(idx + 1).toString().padStart(2, "0")}</td>
                              <td className="py-2 font-medium text-slate-300">{kw}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 20 Advertised job titles */}
                  <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-100"}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-teal-500" />
                      Top 20 Career Title Alignments In Active Markets
                    </h3>
                    <div className="overflow-y-auto max-h-[280px]">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/25">
                            <th className="py-2.5 text-slate-400 font-bold w-12 text-center">No</th>
                            <th className="py-2.5 text-slate-200 font-bold">Standard Job Ad Title</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {data.commonJobTitles20.map((title, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20">
                              <td className="py-2 font-mono text-center text-slate-500 font-bold">{(idx + 1).toString().padStart(2, "0")}</td>
                              <td className="py-2 font-medium text-slate-300">{title}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Highest Paid Certifications */}
                <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    Top 5 Highest-Paid Certifications in My Domain/Track
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                    {data.highestPaidCertifications5.map((cert, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg text-center flex flex-col justify-between ${
                          theme === "dark" ? "bg-slate-950 border border-slate-850" : "bg-slate-50 border border-slate-200"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500 font-bold font-mono">RANK #{idx + 1}</div>
                        <div className="text-xs font-bold my-1 text-slate-100 line-clamp-2" title={cert.name}>{cert.name}</div>
                        <div className="text-[11px] font-bold text-teal-400 tracking-wider font-mono bg-teal-500/10 py-1 rounded">
                          {cert.averagePay}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Country Active Demands */}
                <div className={`p-5 rounded-xl border ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-teal-400" />
                    Top 6 Active Countries Hiring / Relocation Friendliness (Open to Indians)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400">
                          <th className="py-2 px-3 font-bold">Country Name</th>
                          <th className="py-2 px-3 font-bold">Region Group</th>
                          <th className="py-2 px-3 font-bold">Open to Indian Candidates?</th>
                          <th className="py-2 px-3 font-bold">Avg. Visa Processing Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/15">
                        {data.top6Countries.map((country, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/10">
                            <td className="py-2.5 px-3 font-extrabold text-slate-200">{country.country}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-400">{country.region}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
                                {country.openToIndians || (country as any).openIndians || "Yes"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-xs text-slate-300 font-semibold">{country.visaTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Integration section */}
                <div className={`p-6 rounded-xl border ${
                  theme === "dark" 
                    ? "bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 border-slate-800" 
                    : "bg-gradient-to-tr from-teal-50/10 to-teal-50/20 border-teal-100"
                }`}>
                  <h3 className="text-base font-bold text-teal-400 flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-teal-400" />
                    AI Integration Pathways & Adaptive Strategy
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Courses */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Industry-Standard AI Courses Alignment</h4>
                      <ul className="space-y-2">
                        {data.aiIntegration.courses.map((course, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0"></span>
                            <span>{course}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Threat / mitigation */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Emerging Domain AI Threats vs Mitigation</h4>
                      <div className="space-y-3">
                        {data.aiIntegration.fearsAndThrivingStrategy.map((fear, idx) => (
                          <div key={idx} className="text-xs p-3 rounded-lg bg-slate-950/40 border border-slate-800/15">
                            <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                              Threat: {fear.threat}
                            </div>
                            <div className="text-slate-400 font-medium">
                              <span className="text-emerald-400 font-semibold">Thrive Plan:</span> {fear.mitigation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-850 text-xs">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">10-Year Long-Term Strategy to Stay Valued & Win simple AI</h4>
                    <p className="text-slate-300 leading-relaxed font-semibold whitespace-pre-line">
                      {data.aiIntegration.longTermStrategy10Years}
                    </p>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="empty-finder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-12 text-center min-h-[350px] flex flex-col items-center justify-center ${
                  theme === "dark" ? "bg-slate-900/10 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}
              >
                <Brain className={`w-12 h-12 mb-4 animate-bounce ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className="text-sm font-bold tracking-tight text-slate-400">Dossier Workspace Idle</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload your CV or paste raw text in the side drawer. The analysis engine will map global trends, certifications, visa periods, and construct your 10 year AI playbook.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
