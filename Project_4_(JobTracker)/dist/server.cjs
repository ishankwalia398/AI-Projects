var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var geminiApiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (geminiApiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function getAICompletion(prompt, systemInstruction, jsonSchema) {
  const xaiKey = process.env.XAI_API_KEY;
  if (xaiKey) {
    try {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });
      const requestBody = {
        model: "grok-beta",
        // or standard grok-2 / grok-vision-preview
        messages,
        temperature: 0.7
      };
      if (jsonSchema) {
        requestBody.response_format = { type: "json_object" };
      }
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${xaiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
      console.warn("Grok API request failed, falling back to Gemini.", await response.text());
    } catch (e) {
      console.error("Grok completion error, falling back to Gemini:", e);
    }
  }
  if (!ai) {
    throw new Error("No AI API keys configured. Please add GEMINI_API_KEY or XAI_API_KEY to your environment/Secrets panel.");
  }
  try {
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (jsonSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = jsonSchema;
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config
    });
    if (!response.text) {
      throw new Error("Empty response from Gemini API");
    }
    return response.text;
  } catch (err) {
    console.error("Gemini core error:", err);
    throw new Error(`AI processing failed: ${err.message || "Unknown Error"}`);
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiStatus: {
        geminiConfigured: !!geminiApiKey,
        grokConfigured: !!process.env.XAI_API_KEY
      }
    });
  });
  app.post("/api/ai/cover-letter", async (req, res) => {
    const { jdText, resumeText, role, company, type } = req.body;
    if (!jdText) {
      return res.status(400).json({ error: "Job description is required" });
    }
    const docType = type === "linkedin_outreach" ? "LinkedIn Outreach Message" : "Cover Letter";
    const prompt = `
      Please draft a tailored ${docType} for a candidate applying to the position of "${role || "Software Engineer"}" at the company "${company || "this organization"}".

      === JOB DESCRIPTION ===
      ${jdText}

      === CANDIDATE RESUME SUMMARY / TEXT ===
      ${resumeText || "Self-motivated frontend/fullstack developer proficient in modern JavaScript/HTML/CSS frameworks."}

      === OBJECTIVE ===
      Craft a highly engaging, professional, and convincing ${docType}. 
      Make it highly persuasive by matching the candidate's core skills and experiences with the requirements listed in the job description. Do NOT hallucinate experiences that are not in the resume text, but rephrase their existing experience to align with the role. Keep it concise, professional, and properly spaced.
    `;
    try {
      const generatedText = await getAICompletion(
        prompt,
        `You are a premium career coach and professional copywriter specializing in technical job applications. You write elegant, high-converting outreach letters and cover documents. Let's make it direct, compelling and impactful.`
      );
      res.json({ result: generatedText });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/match-score", async (req, res) => {
    const { jdText, resumeText } = req.body;
    if (!jdText || !resumeText) {
      return res.status(400).json({ error: "Both job description and resume content are required" });
    }
    const prompt = `
      Analyze the candidate's resume against the Job Description.

      === JOB DESCRIPTION ===
      ${jdText}

      === CANDIDATE RESUME ===
      ${resumeText}

      === TASKS ===
      1. Calculate a general "Match Score" from 0 to 100 representing how well the candidate is suited intellectually and technically.
      2. Identify a list of "Missing Keywords" (critical tools, languages, methodologies) present in the JD but missing or weak in the resume.
      3. Draft 3-4 highly actionable "Tips/Improvement steps" to modify the resume and get past ATS system screens.
      4. Provide a 2-3 sentence "Executive Summary" summarizing the fit.
    `;
    const matchSchema = {
      type: import_genai.Type.OBJECT,
      properties: {
        score: { type: import_genai.Type.INTEGER, description: "Match score out of 100" },
        missingKeywords: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING },
          description: "Keywords missing in resume that are highly prominent in the job description"
        },
        tips: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING },
          description: "Actionable improvement recommendations for the resume"
        },
        executiveSummary: { type: import_genai.Type.STRING, description: "A high-level summary of the overall alignment and level of fit" }
      },
      required: ["score", "missingKeywords", "tips", "executiveSummary"]
    };
    try {
      const completionText = await getAICompletion(
        prompt,
        "You are an ATS (Applicant Tracking System) optimizer and professional recruiter. Analyze matching criteria strictly and objectively.",
        matchSchema
      );
      res.json(JSON.parse(completionText));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/insights", async (req, res) => {
    const { applications } = req.body;
    if (!applications || !Array.isArray(applications)) {
      return res.status(400).json({ error: "Applications array is required" });
    }
    if (applications.length === 0) {
      return res.json({
        summary: "You haven't added any job applications yet! Head over to the Kanban Board or the List view to add some roles, or click 'Seed Demo Data' to see high-fidelity tracker analytics in action.",
        strengths: ["Clean state ready for tracking"],
        growthAreas: ["Start mapping roles your skills align with"],
        recommendations: ["Add 3 wishlisted roles today", "Configure your monthly goal to keep up the pace"]
      });
    }
    const appPayload = applications.map((app2) => ({
      company: app2.company,
      role: app2.role,
      status: app2.status,
      priority: app2.priority,
      appliedDate: app2.appliedDate,
      source: app2.source || "Unknown",
      tags: app2.tags || []
    }));
    const prompt = `
      We have compiled the user's current list of job applications. Provide deep pipeline insights, patterns, and action steps.

      DATA PAYLOAD:
      ${JSON.stringify(appPayload, null, 2)}
    `;
    const insightSchema = {
      type: import_genai.Type.OBJECT,
      properties: {
        summary: { type: import_genai.Type.STRING, description: "High-level review of the user's current search velocity, diversity of roles, and active pipeline health" },
        strengths: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING },
          description: "2-3 notable trends that represent good application habits (e.g. good prioritization, active follow-ups)"
        },
        growthAreas: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING },
          description: "2-3 opportunities to improve their search methodology, outreach volume, or target diversity"
        },
        recommendations: {
          type: import_genai.Type.ARRAY,
          items: { type: import_genai.Type.STRING },
          description: "3 highly actionable, specific next steps for the user's immediate focus (e.g. follow up with LinkedIn contacts at Google)"
        }
      },
      required: ["summary", "strengths", "growthAreas", "recommendations"]
    };
    try {
      const completionText = await getAICompletion(
        prompt,
        "You are an expert technical recruiter, executive career advisor, and algorithmic optimizer. Analyze the pipeline statistics objectively and give professional coaching feedback.",
        insightSchema
      );
      res.json(JSON.parse(completionText));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AIJobTracker Express+Vite Dev Server running on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical server startup error:", err);
});
//# sourceMappingURL=server.cjs.map
