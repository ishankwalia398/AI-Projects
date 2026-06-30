import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Maximum payload size for big Postman collections
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in user secrets or environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Recursively parses the Postman Collection tree structure
 * to build an in-memory mapped directory structure
 */
interface PostmanEvent {
  listen: string;
  script?: {
    exec?: string[];
  };
}

interface PostmanRequest {
  method: string;
  header?: { key: string; value: string; description?: string }[];
  url?: {
    raw?: string;
    host?: string[];
    path?: string[];
  } | string;
  body?: {
    mode?: string;
    raw?: string;
  };
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
  event?: PostmanEvent[];
}

interface ParsedRequest {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  preRequestScript: string | null;
  testScript: string | null;
  isMfaLogin: boolean;
}

interface ParsedFolder {
  name: string;
  folders: ParsedFolder[];
  requests: ParsedRequest[];
}

function parsePostmanItem(item: PostmanItem): { folders: ParsedFolder[]; requests: ParsedRequest[] } {
  const folders: ParsedFolder[] = [];
  const requests: ParsedRequest[] = [];

  const items = item.item || [];
  for (const child of items) {
    if (child.item) {
      // It's a directory/folder
      const res = parsePostmanItem(child);
      folders.push({
        name: child.name,
        folders: res.folders,
        requests: res.requests,
      });
    } else {
      // It's a request
      const req = child.request;
      if (req) {
        let method = req.method || "GET";
        let urlStr = "";
        if (req.url) {
          if (typeof req.url === "string") {
            urlStr = req.url;
          } else {
            urlStr = req.url.raw || "";
          }
        }

        // Get scripts
        let preRequestScript: string | null = null;
        let testScript: string | null = null;

        const events = child.event || [];
        for (const ev of events) {
          if (ev.listen === "prerequest" && ev.script?.exec) {
            preRequestScript = ev.script.exec.join("\n");
          } else if (ev.listen === "test" && ev.script?.exec) {
            testScript = ev.script.exec.join("\n");
          }
        }

        // Parse headers
        const headers: Record<string, string> = {};
        if (req.header) {
          for (const h of req.header) {
            if (h.key) {
              headers[h.key] = h.value || "";
            }
          }
        }

        // Parse body
        let bodyContent: string | null = null;
        if (req.body && req.body.mode === "raw" && req.body.raw) {
          bodyContent = req.body.raw;
        }

        const isMfaLogin = urlStr.includes("ottuser/action/mfalogin") || child.name.toLowerCase().includes("mfalogin");

        requests.push({
          name: child.name,
          method,
          url: urlStr,
          headers,
          body: bodyContent,
          preRequestScript,
          testScript,
          isMfaLogin,
        });
      }
    }
  }

  return { folders, requests };
}

// Endpoint to perform the heavy conversion
app.post("/api/convert", async (req, res) => {
  try {
    const { collection, environment, otpConfig } = req.body;

    if (!collection) {
      return res.status(400).json({ error: "Missing required 'collection' field." });
    }

    const collectionName = collection.info?.name || "Postman Collection";
    const roots = parsePostmanItem(collection);
    const rootFolder: ParsedFolder = {
      name: collectionName,
      folders: roots.folders,
      requests: roots.requests,
    };

    // Dynamic environment variables dictionary
    const envVars: Record<string, string> = {};
    if (environment && Array.isArray(environment.values)) {
      for (const item of environment.values) {
        if (item.enabled !== false && item.key) {
          envVars[item.key] = item.value || "";
        }
      }
    }

    // Initial default scripts generated or requested
    const targetModel = "gemini-3.5-flash"; // extremely fast and accurate for code templates
    let ai;
    try {
      ai = getAiClient();
    } catch {
      // Fallback if no API key is set
      console.warn("GoogleGenAI not initialized: Missing API key. Proceeding with static rule-based parsing.");
    }

    // Utility: Async function to perform GPT scripts translation
    async function translateScript(scriptText: string, type: "pre" | "post", reqContext: string): Promise<string> {
      if (!ai) {
        return `// static fallback translation\n// Original Postman script:\n/*\n${scriptText}\n*/`;
      }

      const prompt = `You are an expert QA and automation engineer speciallizing in Playwright.
Translate the following Postman ${type === "pre" ? "pre-request" : "test (post-request)"} script into modern executable Playwright API test syntax.

Context of the request:
${reqContext}

Original Postman script to translate:
\`\`\`js
${scriptText}
\`\`\`

Strict translation rules:
- Assume variables are retrieved or stored in a shared global JavaScript Maps named 'vars' (e.g. replace 'pm.environment.set(\"foo\", \"bar\")' with 'vars.set(\"foo\", \"bar\");', 'pm.environment.get(\"foo\")' with 'vars.get(\"foo\")').
- Convert pm.test assertions to Playwright 'expect' assertions.
- Do not add comments or explanations. Just return the clean resulting Javascript/Typescript code block.
- Keep variables dynamic based on 'vars'.
- Do not wrap in markdown tags like \`\`\`typescript, just output raw Javascript.`;

      try {
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: prompt,
        });
        return response.text || `// Failed translation mapping.`;
      } catch (err: any) {
        return `// Error migrating script: ${err.message}\n` + scriptText;
      }
    }

    // Recursively build up Playwright lines
    async function convertFolderToPlaywright(folder: ParsedFolder, depth = 1): Promise<string> {
      const indent = "  ".repeat(depth);
      let output = "";

      for (const req of folder.requests) {
        output += `${indent}// Request: ${req.name}\n`;
        output += `${indent}test(${JSON.stringify(req.name)}, async ({ request }) => {\n`;

        // Pre-request script
        if (req.preRequestScript) {
          output += `${indent}  // --- Pre-request Script ---\n`;
          const translatedPre = await translateScript(req.preRequestScript, "pre", `Method: ${req.method}, URL: ${req.url}`);
          output += translatedPre.split("\n").map(l => `${indent}  ${l}`).join("\n") + "\n\n";
        }

        // Insert OTP handler if MFA login endpoint
        if (req.isMfaLogin) {
          output += `${indent}  // --- Auto-Injected OTP Verification Flow ---\n`;
          output += `${indent}  const registeredEmail = vars.get("email") || vars.get("username") || "user@example.com";\n`;
          output += `${indent}  console.log('Detected MFALogin request. Fetching dynamic OTP...');\n`;
          output += `${indent}  const extractedOTP = await getOTPForEmail(registeredEmail);\n`;
          output += `${indent}  vars.set("otp", extractedOTP);\n\n`;
        }

        // Prep URL with variables
        output += `${indent}  // Resolve Dynamic Variables in URL\n`;
        output += `${indent}  let url = ${JSON.stringify(req.url)};\n`;
        output += `${indent}  for (const [key, val] of vars.entries()) {\n`;
        output += `${indent}    url = url.replace(new RegExp('{{' + key + '}}', 'g'), val);\n`;
        output += `${indent}  }\n\n`;

        // HTTP Headers resolv
        output += `${indent}  const headers: Record<string, string> = {};\n`;
        for (const [hk, hv] of Object.entries(req.headers)) {
          output += `${indent}  headers[${JSON.stringify(hk)}] = ${JSON.stringify(hv)}.replace(/{{(.*?)}}/g, (_, k) => vars.get(k) || '');\n`;
        }
        output += "\n";

        // Body resolve
        if (req.body) {
          output += `${indent}  let bodyStr = ${JSON.stringify(req.body)};\n`;
          output += `${indent}  bodyStr = bodyStr.replace(/{{(.*?)}}/g, (_, k) => vars.get(k) || '');\n`;
          
          // If this is mfalogin and otp token is placed, handle explicitly
          if (req.isMfaLogin) {
            output += `${indent}  // Ensure OTP resolved\n`;
            output += `${indent}  try {\n`;
            output += `${indent}    const bodyObj = JSON.parse(bodyStr);\n`;
            output += `${indent}    if (bodyObj.otp === undefined || bodyObj.otp === '{{otp}}') {\n`;
            output += `${indent}      bodyObj.otp = extractedOTP || '123456';\n`;
            output += `${indent}    }\n`;
            output += `${indent}    bodyStr = JSON.stringify(bodyObj);\n`;
            output += `${indent}  } catch (e) {}\n`;
          }
          output += `${indent}  const data = JSON.parse(bodyStr);\n\n`;
        } else {
          output += `${indent}  const data = undefined;\n\n`;
        }

        // Network request
        output += `${indent}  console.log(\`${req.method} request to URL: \` + url);\n`;
        output += `${indent}  const response = await request.${req.method.toLowerCase()}(url, {\n`;
        output += `${indent}    headers,\n`;
        output += `${indent}    data,\n`;
        output += `${indent}  });\n\n`;

        // Check test script assertions
        if (req.testScript) {
          output += `${indent}  // --- Test / Post-request Assertions ---\n`;
          const translatedTest = await translateScript(req.testScript, "post", `Method: ${req.method}, Response Status expected verification`);
          output += translatedTest.split("\n").map(l => `${indent}  ${l}`).join("\n") + "\n";
        } else {
          output += `${indent}  expect(response.ok()).toBeTruthy();\n`;
        }

        output += `${indent}});\n\n`;
      }

      for (const nested of folder.folders) {
        output += `${indent}test.describe(${JSON.stringify(nested.name)}, () => {\n`;
        output += await convertFolderToPlaywright(nested, depth + 1);
        output += `${indent}});\n\n`;
      }

      return output;
    }

    // Build overall script structure
    let finalScript = `import { test, expect } from '@playwright/test';\n\n`;
    finalScript += `// Map to holding environment and runtime variables\n`;
    finalScript += `const vars = new Map<string, string>();\n\n`;

    // Seed variables
    finalScript += `// Pre-populate Postman environment variables\n`;
    for (const [k, v] of Object.entries(envVars)) {
      finalScript += `vars.set(${JSON.stringify(k)}, ${JSON.stringify(v)});\n`;
    }
    finalScript += `\n`;

    // Add OTP Verification helper
    finalScript += `/**\n * Injected helper to securely fetch dynamic OTP emails from Mailinator\n */\n`;
    finalScript += `async function getOTPForEmail(emailAddress: string): Promise<string> {\n`;
    finalScript += `  const mailboxName = emailAddress.split('@')[0];\n`;
    finalScript += `  const startTime = Date.now();\n`;
    finalScript += `  const timeout = 60000; // 60s timeout limit\n`;
    finalScript += `  console.log(\`[OTP] Public Mailinator mailbox name: \${mailboxName}\`);\n`;
    finalScript += `  while (Date.now() - startTime < timeout) {\n`;
    finalScript += `    try {\n`;
    finalScript += `      const response = await fetch(\`https://api.mailinator.com/api/v2/domains/public/inboxes/\${mailboxName}/messages\`);\n`;
    finalScript += `      if (response.ok) {\n`;
    finalScript += `        const json = await response.json();\n`;
    finalScript += `        const messages = json.msgs || [];\n`;
    finalScript += `        if (messages.length > 0) {\n`;
    finalScript += `          const latestMsg = messages[0];\n`;
    finalScript += `          console.log(\`[OTP] Found latest message header: \${latestMsg.subject}\`);\n`;
    finalScript += `          \n`;
    finalScript += `          const detailsRes = await fetch(\`https://api.mailinator.com/api/v2/domains/public/inboxes/\${mailboxName}/messages/\${latestMsg.id}\`);\n`;
    finalScript += `          if (detailsRes.ok) {\n`;
    finalScript += `            const detailsJson = await detailsRes.json();\n`;
    finalScript += `            const body = detailsJson.parts?.[0]?.body || '';\n`;
    finalScript += `            const match = body.match(/\\\\b\\\\d{6}\\\\b/) || body.match(/\\\\b\\\\d{4}\\\\b/);\n`;
    finalScript += `            if (match) {\n`;
    finalScript += `              console.log(\`[OTP] Successfully parsed active verification code: \${match[0]}\`);\n`;
    finalScript += `              return match[0];\n`;
    finalScript += `            }\n`;
    finalScript += `          }\n`;
    finalScript += `        }\n`;
    finalScript += `      }\n`;
    finalScript += `    } catch (e) {\n`;
    finalScript += `      console.warn('[OTP] Mailinator endpoint unreachable. Retrying...');\n`;
    finalScript += `    }\n`;
    finalScript += `    await new Promise(resolve => setTimeout(resolve, 5000));\n`;
    finalScript += `  }\n`;
    finalScript += `  \n`;
    finalScript += `  // Fallback dynamic generator\n`;
    finalScript += `  const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();\n`;
    finalScript += `  console.log(\`[OTP] Fallback generated dynamic OTP token: \${mockOTP}\`);\n`;
    finalScript += `  return mockOTP;\n`;
    finalScript += `}\n\n`;

    function countTotalRequests(folder: ParsedFolder): number {
      let count = folder.requests.length;
      for (const sub of folder.folders) {
        count += countTotalRequests(sub);
      }
      return count;
    }

    function checkHasMfa(folder: ParsedFolder): boolean {
      if (folder.requests.some(r => r.isMfaLogin)) return true;
      for (const sub of folder.folders) {
        if (checkHasMfa(sub)) return true;
      }
      return false;
    }

    const totalRequestsCount = countTotalRequests(rootFolder);
    const hasMfaActive = checkHasMfa(rootFolder);

    // Write tests
    finalScript += `test.describe(${JSON.stringify(collectionName)}, () => {\n`;
    finalScript += await convertFolderToPlaywright(rootFolder, 1);
    finalScript += `});\n`;

    // Also supply standard configuration and instructions files
    const configPlaywright = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  reporter: 'html',
  use: {
    actionTimeout: 0,
    trace: 'on-first-retry',
  },
});\n`;

    const packageJson = `{
  "name": "playwright-postman-migration",
  "version": "1.0.0",
  "description": "Auto-converted Playwright script project matching Postman collection",
  "devDependencies": {
    "@playwright/test": "^1.42.0"
  },
  "scripts": {
    "test": "npx playwright test"
  }
}\n`;

    res.json({
      success: true,
      script: finalScript,
      config: configPlaywright,
      packageJson: packageJson,
      summary: {
        totalRequests: totalRequestsCount,
        totalFolders: roots.folders.length,
        hasMfa: hasMfaActive,
      }
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Conversion process failed: " + err.message });
  }
});

// Configure Vite or Static server
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  bootServer();
}

export default app;
