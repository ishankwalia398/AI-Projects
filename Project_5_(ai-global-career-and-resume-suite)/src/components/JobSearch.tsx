import { useState } from "react";
import { Globe, ShieldAlert, Sparkles, Copy, FileText, Download, Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { downloadAsPdf, downloadAsMd, downloadAsDocx, copyToClipboard } from "../utils/downloadHelper";
import { JobSearchResponse } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface JobSearchProps {
  theme: "light" | "dark";
}

const REGION_COUNTRIES: Record<string, { name: string; countries: string[] }> = {
  APAC: {
    name: "APAC (Asia-Pacific)",
    countries: ["Singapore", "Australia", "Japan", "New Zealand", "India", "South Korea", "Hong Kong", "Malaysia", "Thailand", "Vietnam", "Philippines", "Taiwan", "Indonesia"]
  },
  "Middle East": {
    name: "Middle East",
    countries: ["United Arab Emirates (UAE)", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain", "Jordan", "Israel", "Egypt"]
  },
  EU: {
    name: "EU (European Union)",
    countries: ["Netherlands", "Germany", "Ireland", "Sweden", "Finland", "France", "Belgium", "Denmark", "Austria", "Spain", "Italy", "Portugal", "Luxembourg", "Estonia", "Poland", "Czech Republic", "Greece", "Hungary"]
  },
  US: {
    name: "US (United States)",
    countries: ["United States", "United States (East Coast)", "United States (West Coast)", "United States (Remote Hubs)", "Puerto Rico"]
  },
  EMEA: {
    name: "EMEA (Europe, Mid-East, Africa)",
    countries: ["United Kingdom", "Switzerland", "Norway", "South Africa", "Nigeria", "Egypt", "Turkey", "Israel", "Kenya", "Ghana", "Romania", "Ukraine"]
  },
  CANADA: {
    name: "CANADA",
    countries: ["Canada", "Canada (Ontario)", "Canada (British Columbia)", "Canada (Alberta)", "Canada (Quebec)"]
  }
};

export function JobSearch({ theme }: JobSearchProps) {
  const [selectedCountries, setSelectedCountries] = useState<Record<string, string[]>>({});
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({
    EU: false,
    APAC: false,
    "Middle East": false,
    US: false,
    EMEA: false,
    CANADA: false
  });
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<JobSearchResponse | null>(null);
  const [copiedRegion, setCopiedRegion] = useState<string | null>(null);

  const toggleRegionExpand = (regionId: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionId]: !prev[regionId]
    }));
  };

  const handleCountryToggle = (regionId: string, country: string) => {
    setSelectedCountries((prev) => {
      const list = prev[regionId] || [];
      const isSelected = list.includes(country);
      const nextList = isSelected 
        ? list.filter((c) => c !== country) 
        : [...list, country];
      
      const nextObj = { ...prev };
      if (nextList.length === 0) {
        delete nextObj[regionId];
      } else {
        nextObj[regionId] = nextList;
      }
      return nextObj;
    });
  };

  const handleSelectAllInRegion = (regionId: string) => {
    const all = REGION_COUNTRIES[regionId].countries;
    const current = selectedCountries[regionId] || [];
    const isAll = current.length === all.length;

    setSelectedCountries((prev) => {
      const nextObj = { ...prev };
      if (isAll) {
        delete nextObj[regionId];
      } else {
        nextObj[regionId] = [...all];
      }
      return nextObj;
    });
  };

  const totalCountriesCount = Object.values(REGION_COUNTRIES).reduce(
    (acc, reg) => acc + reg.countries.length,
    0
  );
  
  const selectedCountriesCount = Object.keys(selectedCountries).reduce(
    (acc, regionKey) => acc + (selectedCountries[regionKey] || []).length,
    0
  );

  const isAllSelected = selectedCountriesCount === totalCountriesCount;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedCountries({});
    } else {
      const all: Record<string, string[]> = {};
      Object.keys(REGION_COUNTRIES).forEach((key) => {
        all[key] = [...REGION_COUNTRIES[key].countries];
      });
      setSelectedCountries(all);
    }
  };

  const getRegionDisplayName = (key: string) => {
    const cleanKey = Object.keys(REGION_COUNTRIES).find(
      (k) => k.toLowerCase() === key.toLowerCase() || key.toLowerCase().includes(k.toLowerCase())
    );
    
    if (cleanKey) {
      const selected = selectedCountries[cleanKey] || [];
      if (selected.length > 0) {
        const total = REGION_COUNTRIES[cleanKey].countries.length;
        if (selected.length === total) {
          return `${REGION_COUNTRIES[cleanKey].name} (All Countries)`;
        }
        return `${REGION_COUNTRIES[cleanKey].name} (${selected.join(", ")})`;
      }
      return REGION_COUNTRIES[cleanKey].name;
    }
    return key;
  };

  const handleSearch = async () => {
    if (!domain.trim()) {
      setError("Please enter a target domain first.");
      return;
    }
    const payloadRegions: string[] = [];
    Object.keys(selectedCountries).forEach((regionId) => {
      const list = selectedCountries[regionId] || [];
      if (list.length > 0) {
        const totalCountries = REGION_COUNTRIES[regionId].countries.length;
        if (list.length === totalCountries) {
          payloadRegions.push(`${regionId} (All Countries)`);
        } else {
          payloadRegions.push(`${regionId} (${list.join(", ")})`);
        }
      }
    });

    if (payloadRegions.length === 0) {
      setError("Please select at least one region and country.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regions: payloadRegions, domain: domain.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to retrieve international directories.");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  };

  const constructPlainTableText = (regionName: string) => {
    if (!data || !data.regionsData[regionName]) return "";
    const reg = data.regionsData[regionName];
    
    let text = `# SPONSORSHIP DIRECTORY FOR REGION: ${regionName.toUpperCase()}\n\n`;
    
    text += `## 1. DIRECT COMPANIES & SPONSORING EMPLOYERS\n\n`;
    text += `| No. | Name | Website URL | Hiring Alignment & Relocation Benefits |\n`;
    text += `|---|---|---|---|\n`;
    reg.companies.forEach((co, idx) => {
      text += `| ${idx + 1} | ${co.name} | ${co.url} | ${co.benefits} |\n`;
    });

    text += `\n## 2. RECRUITMENT & STAFFING AGENCIES IN REGION\n\n`;
    text += `| No. | Name | Website URL | Expat Assistance & Sponsorship Focus |\n`;
    text += `|---|---|---|---|\n`;
    reg.agencies.forEach((ag, idx) => {
      text += `| ${idx + 1} | ${ag.name} | ${ag.url} | ${ag.benefits} |\n`;
    });

    return text;
  };

  const handleCopy = async (regionName: string) => {
    const tableText = constructPlainTableText(regionName);
    const success = await copyToClipboard(tableText);
    if (success) {
      setCopiedRegion(regionName);
      setTimeout(() => setCopiedRegion(null), 2000);
    }
  };

  const handleDownload = (regionName: string, format: "pdf" | "md" | "docx") => {
    const tableText = constructPlainTableText(regionName);
    const filename = `Sponsorship_Directory_${regionName.replace(/\s+/g, "_")}`;
    const docTitle = `Active Sponsoring Organizations - ${regionName}`;

    if (format === "pdf") {
      downloadAsPdf(filename, docTitle, tableText);
    } else if (format === "md") {
      downloadAsMd(filename, tableText);
    } else {
      downloadAsDocx(filename, tableText);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-500" />
            Active Sponsoring Job Directories
          </h1>
          <p className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Configure targets across APAC, EU, Middle East, USA, and CANADA. Extract a certified directory of employers and recruitment agencies based on your selected countries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Region Customizer Card */}
        <div className={`col-span-1 lg:col-span-4 p-5 rounded-xl border ${
          theme === "dark" ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
        } space-y-4`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-800/10">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Target Region Config
            </div>
            <button
              onClick={handleToggleAll}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800 hover:bg-slate-700 text-teal-400"
                  : "bg-slate-100 hover:bg-slate-200 text-teal-600"
              }`}
            >
              {isAllSelected ? "Deselect All" : "Select All Regions"}
            </button>
          </div>

          {/* Enter Domain Input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Enter the domain
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineering, Healthcare, Finance"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={`w-full p-2.5 rounded-lg text-xs font-semibold focus:outline-none transition-all ${
                theme === "dark"
                  ? "bg-slate-950 border-slate-850 text-slate-100 focus:border-teal-500"
                  : "bg-slate-50 border-slate-200 text-slate-950 focus:border-teal-500"
              }`}
            />
          </div>

          <div className="space-y-2.5 mt-2 max-h-[480px] overflow-y-auto pr-1">
            {Object.keys(REGION_COUNTRIES).map((regionId) => {
              const region = REGION_COUNTRIES[regionId];
              const countriesSelected = selectedCountries[regionId] || [];
              const isExpanded = expandedRegions[regionId];
              const isFullySelected = countriesSelected.length === region.countries.length;
              const isPartiallySelected = countriesSelected.length > 0 && !isFullySelected;

              return (
                <div
                  key={regionId}
                  className={`border rounded-lg transition-all overflow-hidden ${
                    countriesSelected.length > 0
                      ? theme === "dark"
                        ? "bg-slate-950/20 border-teal-500/20"
                        : "bg-teal-50/10 border-teal-500/10"
                      : theme === "dark"
                        ? "bg-slate-950/15 border-slate-850/60"
                        : "bg-slate-50/50 border-slate-100"
                  }`}
                >
                  {/* Region Row Header */}
                  <div
                    className={`p-2.5 flex items-center justify-between gap-2 border-b transition-colors ${
                      theme === "dark"
                        ? "bg-slate-900/40 border-slate-850"
                        : "bg-slate-100/50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="checkbox"
                        className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 h-3.5 w-3.5 cursor-pointer"
                        checked={isFullySelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={() => handleSelectAllInRegion(regionId)}
                      />
                      <span
                        onClick={() => toggleRegionExpand(regionId)}
                        className={`text-xs font-bold cursor-pointer transition-colors truncate select-none ${
                          countriesSelected.length > 0
                            ? "text-teal-400"
                            : theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-700"
                        }`}
                      >
                        {region.name}
                        {countriesSelected.length > 0 && (
                          <span className="ml-1.5 text-[10px] font-semibold text-slate-500">
                            ({countriesSelected.length}/{region.countries.length})
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRegionExpand(regionId)}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        theme === "dark"
                          ? "hover:bg-slate-800 text-slate-400"
                          : "hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Sub-countries Checklist */}
                  {isExpanded && (
                    <div className={`p-3 space-y-2 ${theme === "dark" ? "bg-slate-900/10" : "bg-white"}`}>
                      <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-slate-800/10">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Select Countries</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllInRegion(regionId)}
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded cursor-pointer ${
                            theme === "dark"
                              ? "bg-slate-800 text-teal-400 hover:bg-slate-700"
                              : "bg-slate-100 text-teal-600 hover:bg-slate-200"
                          }`}
                        >
                          {isFullySelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 pt-1">
                        {region.countries.map((country) => {
                          const isCountryChecked = countriesSelected.includes(country);
                          return (
                            <label
                              key={country}
                              className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer transition-all select-none ${
                                isCountryChecked
                                  ? theme === "dark"
                                    ? "bg-teal-500/15 border-teal-500/35 text-teal-300 font-medium"
                                    : "bg-teal-50/70 border-teal-200 text-teal-700 font-medium"
                                  : theme === "dark"
                                    ? "bg-slate-950/10 border-slate-850/50 text-slate-400 hover:border-slate-800"
                                    : "bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 h-3 w-3 cursor-pointer"
                                checked={isCountryChecked}
                                onChange={() => handleCountryToggle(regionId, country)}
                              />
                              <span className="truncate" title={country}>{country}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs tracking-wide rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {isLoading ? "Fetching Directories..." : "Generate Sponsorship Lists"}
          </button>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Directory Results Viewport */}
        <div className="col-span-1 lg:col-span-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-xl border p-12 text-center flex flex-col items-center justify-center min-h-[350px] ${
                  theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"
                }`}
              >
                <div className="w-12 h-12 rounded-full border-4 border-teal-500/25 border-t-teal-500 animate-spin mb-4"></div>
                <h3 className="text-sm font-bold tracking-tight mb-1 text-teal-400 animate-pulse">
                  Querying Global Relocation Directories
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Reaching out to verify active visa sponsorships schemes, researching 30 distinct organizations plus 30 specialized staffing agencies for each selected region...
                </p>
              </motion.div>
            ) : data ? (
              <motion.div
                key="results-search"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {Object.keys(data.regionsData).map((regionKey) => {
                  const regData = data.regionsData[regionKey];
                  return (
                    <div
                      key={regionKey}
                      className={`p-6 rounded-xl border ${
                        theme === "dark" ? "bg-slate-905 border-slate-800" : "bg-white border-slate-100"
                      } space-y-4`}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/10">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400">
                            {getRegionDisplayName(regionKey)} Active Directory
                          </span>
                          <h3 className="text-base font-bold text-slate-200 mt-1">30 Sponsoring Direct Employers & 30 Staffing Agencies</h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(regionKey)}
                            className="px-2.5 py-1.5 rounded bg-slate-950 text-slate-300 border border-slate-850 hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer font-bold"
                          >
                            {copiedRegion === regionKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedRegion === regionKey ? "Copied!" : "Copy Table"}
                          </button>
                          <button
                            onClick={() => handleDownload(regionKey, "pdf")}
                            className="px-2.5 py-1.5 rounded bg-emerald-500 text-slate-900 hover:bg-emerald-600 text-xs flex items-center gap-1 cursor-pointer font-extrabold"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                          <button
                            onClick={() => handleDownload(regionKey, "md")}
                            className="px-2.5 py-1.5 rounded bg-slate-950 text-slate-400 hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer font-bold border border-slate-850"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            MD
                          </button>
                          <button
                            onClick={() => handleDownload(regionKey, "docx")}
                            className="px-2.5 py-1.5 rounded bg-slate-950 text-slate-400 hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer font-bold border border-slate-850"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Word
                          </button>
                        </div>
                      </div>

                      {/* Direct Sponsoring Employers Table */}
                      <div>
                        <h4 className="text-xs font-extrabold pb-2.5 text-emerald-400 flex items-center gap-1">
                          📋 Part 1: Sponsoring Employers (Direct Hires equivalent to Swisscom/Dynatrace)
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-850/35">
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400">
                                <th className="py-2.5 px-3 font-bold w-12 text-center">No.</th>
                                <th className="py-2.5 px-3 font-bold">Organization Name</th>
                                <th className="py-2.5 px-3 font-bold">Verifiable Plain URL</th>
                                <th className="py-2.5 px-3 font-bold">Visa Scheme & Relocation Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {regData.companies.map((co, idx) => (
                                <tr key={idx} className="hover:bg-slate-950/20">
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">#{co.num || idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-200">{co.name}</td>
                                  <td className="py-2 px-3 font-mono text-xs text-teal-400 break-all select-all font-semibold" title="Strict plain text URL">{co.url}</td>
                                  <td className="py-2 px-3 text-slate-400 leading-normal">{co.benefits}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Staffing Agencies Table */}
                      <div className="pt-4">
                        <h4 className="text-xs font-extrabold pb-2.5 text-teal-400 flex items-center gap-1">
                          📋 Part 2: Recruitment & Staffing Agencies (Specialized in relocation & international hires)
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-850/35">
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-850 bg-slate-950/40 text-slate-400">
                                <th className="py-2.5 px-3 font-bold w-12 text-center">No.</th>
                                <th className="py-2.5 px-3 font-bold">Staffing Agency</th>
                                <th className="py-2.5 px-3 font-bold">Verifiable Plain URL</th>
                                <th className="py-2.5 px-3 font-bold">Assistance Focus</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {regData.agencies.map((ag, idx) => (
                                <tr key={idx} className="hover:bg-slate-950/20">
                                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">#{ag.num || idx + 1}</td>
                                  <td className="py-2 px-3 font-bold text-slate-200">{ag.name}</td>
                                  <td className="py-2 px-3 font-mono text-xs text-emerald-400 break-all select-all font-semibold" title="Strict plain text URL">{ag.url}</td>
                                  <td className="py-2 px-3 text-slate-400 leading-normal">{ag.benefits}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty-search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl border p-12 text-center min-h-[350px] flex flex-col items-center justify-center ${
                  theme === "dark" ? "bg-slate-900/10 border-slate-850" : "bg-slate-50 border-slate-200"
                }`}
              >
                <Globe className={`w-12 h-12 mb-4 animate-bounce ${theme === "dark" ? "text-slate-700" : "text-slate-300"}`} />
                <h3 className="text-sm font-bold tracking-tight text-slate-400">Enterprise Directories Idle</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select your target relocation regions (EU, APAC, US, etc.) in the dashboard configuration card on the left to pull 30 active sponsors and 30 agencies customized directories.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
