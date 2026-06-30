/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileJson, 
  FolderSync, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText, 
  Play, 
  Key, 
  Settings, 
  Mail, 
  HelpCircle,
  Code2,
  Package,
  Layers,
  ArrowRight
} from "lucide-react";

export default function App() {
  const [collectionFile, setCollectionFile] = useState<File | null>(null);
  const [envFile, setEnvFile] = useState<File | null>(null);
  const [collectionJson, setCollectionJson] = useState<any>(null);
  const [envJson, setEnvJson] = useState<any>(null);
  
  // Output response states
  const [isConverting, setIsConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [conversionResult, setConversionResult] = useState<{
    script: string;
    config: string;
    packageJson: string;
    summary: {
      totalRequests: number;
      totalFolders: number;
      hasMfa: boolean;
    };
  } | null>(null);

  // General Tabs
  const [activeTab, setActiveTab] = useState<"playwright" | "config" | "package">("playwright");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCollectionDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) {
      setCollectionFile(file);
      parseFile(file, setCollectionJson);
    }
  };

  const handleEnvDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) {
      setEnvFile(file);
      parseFile(file, setEnvJson);
    }
  };

  const parseFile = (file: File, callback: (data: any) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        callback(parsed);
        setErrorMsg("");
      } catch (err) {
        setErrorMsg(`Failed to parse ${file.name}. Invalid JSON format.`);
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const triggerConversion = async () => {
    if (!collectionJson) {
      setErrorMsg("Please provide a valid Postman Collection JSON first.");
      return;
    }

    setIsConverting(true);
    setErrorMsg("");
    setConversionResult(null);

    const otpConfig = {
      method: "mailinator"
    };

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection: collectionJson,
          environment: envJson,
          otpConfig,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setConversionResult(result);
      } else {
        setErrorMsg(result.error || "Failed to process the files.");
      }
    } catch (err: any) {
      setErrorMsg("Error communicating with the backend generator. Please ensure the app server is fully booted.");
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
      {/* Premium Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-900">Postman ⇄ Playwright</h1>
              <p className="text-xs text-slate-500 font-medium">Automatic Folder-to-Folder Test Restructuring & OTP-Injected Playwright Scripts</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
            >
              Open AI Studio
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration & Inputs */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* File Upload Zone CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">1. Source files upload</h2>
            
            {/* Postman Collection Dropper */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCollectionDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                collectionFile 
                  ? "border-emerald-500 bg-emerald-50/20" 
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white"
              }`}
            >
              <input 
                id="collection-input"
                type="file" 
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCollectionFile(file);
                    parseFile(file, setCollectionJson);
                  }
                }}
              />
              <label htmlFor="collection-input" className="cursor-pointer block">
                <FileJson className={`w-8 h-8 mx-auto mb-2.5 ${collectionFile ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="block text-xs font-medium text-slate-600 mb-0.5">
                  {collectionFile ? collectionFile.name : "Postman Collection JSON"}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {collectionFile ? "File successfully uploaded" : "Drag & drop collection file or click here"}
                </span>
              </label>
            </div>

            {/* Postman Environment Dropper */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleEnvDrop}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                envFile 
                  ? "border-emerald-500 bg-emerald-50/20" 
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white"
              }`}
            >
              <input 
                id="env-input"
                type="file" 
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEnvFile(file);
                    parseFile(file, setEnvJson);
                  }
                }}
              />
              <label htmlFor="env-input" className="cursor-pointer block">
                <Settings className={`w-8 h-8 mx-auto mb-2.5 ${envFile ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="block text-xs font-medium text-slate-600 mb-0.5">
                  {envFile ? envFile.name : "Environment Variables JSON (Optional)"}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {envFile ? "Environment variables parsed successfully" : "Drag & drop env file or click here"}
                </span>
              </label>
            </div>
          </div>

          {/* Trigger Action */}
          <button
            type="button"
            onClick={triggerConversion}
            disabled={isConverting || !collectionJson}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
              isConverting || !collectionJson
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg active:scale-98 active:shadow-xs"
            }`}
          >
            {isConverting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Processing Postman Scripts...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Generate Playwright Script</span>
              </>
            )}
          </button>

          {/* Error Feedbacks */}
          {errorMsg && (
            <div className="bg-red-50 text-red-800 border border-red-100 p-4 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Conversion Error Detected</p>
                <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Code Outputs, n8n Flow & Playwright Files */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Quick Preview Header Tabs */}
          <div className="flex bg-slate-200/60 p-1.5 rounded-xl space-x-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("playwright")}
              className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === "playwright" 
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>playwright.spec.ts</span>
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === "config" 
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>config.ts</span>
            </button>
            <button
              onClick={() => setActiveTab("package")}
              className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                activeTab === "package" 
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/50" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>package.json</span>
            </button>
          </div>

          {/* Result Block Card Code Viewer */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 relative flex flex-col flex-1 min-h-[480px] shadow-lg border border-slate-800">
            
            {/* Context/Actions Controls */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium">
                {activeTab === "playwright" && "Generated Playwright End-to-End API Test Schema"}
                {activeTab === "config" && "Vite/Playwright Global Config Settings Setup"}
                {activeTab === "package" && "Manifest File for Local Executions"}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    let content = "";
                    let label = "";
                    if (activeTab === "playwright") {
                      content = conversionResult?.script || "// Trigger code generation to inspect converted scripts";
                      label = "playwright";
                    } else if (activeTab === "config") {
                      content = conversionResult?.config || "// Standard configuration is dynamically loaded after generation";
                      label = "config";
                    } else {
                      content = conversionResult?.packageJson || "{/* Package details generated dynamically */ }";
                      label = "package";
                    }
                    handleCopy(content, label);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors border border-slate-700 hover:text-white"
                  title="Copy contents"
                >
                  {copiedText?.startsWith(activeTab) ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "playwright") {
                      downloadFile(conversionResult?.script || "", "playwright.spec.ts");
                    } else if (activeTab === "config") {
                      downloadFile(conversionResult?.config || "", "playwright.config.ts");
                    } else {
                      downloadFile(conversionResult?.packageJson || "", "package.json");
                    }
                  }}
                  disabled={!conversionResult}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* In-view code snippet rendering */}
            <div className="flex-1 overflow-auto rounded-xl bg-slate-950 font-mono text-xs p-5 select-text leading-relaxed border border-slate-800/30">
              {activeTab === "playwright" && (
                conversionResult ? (
                  <pre className="text-emerald-400 whitespace-pre-wrap">{conversionResult.script}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-3.5">
                    <FileText className="w-10 h-10 text-slate-600 stroke-1" />
                    <div>
                      <p className="font-semibold text-slate-400 text-sm">No Playwright tests generated yet.</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mt-1 mx-auto">Upload collection files on the left & prompt the conversion system to automatically resolve folder hierarchies.</p>
                    </div>
                  </div>
                )
              )}

              {activeTab === "config" && (
                conversionResult ? (
                  <pre className="text-blue-400 whitespace-pre-wrap">{conversionResult.config}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-3">
                    <Settings className="w-10 h-10 text-slate-600 stroke-1" />
                    <div>
                      <p className="font-semibold text-slate-400 text-sm">Configure Playwright Environment Settings</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mt-1 mx-auto">This setting contains standard automated rules and time boundary constraints ready for direct exports.</p>
                    </div>
                  </div>
                )
              )}

              {activeTab === "package" && (
                conversionResult ? (
                  <pre className="text-indigo-400 whitespace-pre-wrap">{conversionResult.packageJson}</pre>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-3">
                    <Package className="w-10 h-10 text-slate-600 stroke-1" />
                    <div>
                      <p className="font-semibold text-slate-400 text-sm">Standard Node Manifest</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mt-1 mx-auto">Contains references to dependencies ensuring immediate testing commands compatibility.</p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Conversion Summary Stats bar */}
            {conversionResult && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/20 px-2.5 py-2 rounded-lg">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span className="font-semibold text-emerald-400">Successfully converted!</span>
                </span>
                <div className="flex space-x-4 font-mono text-[11px]">
                  <div>Requests: <span className="text-white font-bold">{conversionResult.summary.totalRequests}</span></div>
                  <div>Folders Detected: <span className="text-white font-bold">{conversionResult.summary.totalFolders}</span></div>
                  {conversionResult.summary.hasMfa && (
                    <div className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-sm flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span>Injected OTP flow enabled</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Global subtle page footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p>© 2026 AI Studio. Clean single-view Postman Playwright Restoration Hub.</p>
          <p className="font-mono text-[10px] text-slate-400">Production ready system builds</p>
        </div>
      </footer>

    </div>
  );
}
