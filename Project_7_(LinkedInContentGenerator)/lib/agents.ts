import { Groq } from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { excelManager } from './excelManager';
import { ContentRow, ContentStatus } from './types';

// Retry wrapper for Groq API calls that may return empty responses
async function callGroqWithRetry(
  groq: Groq,
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: messages as any,
        model,
        temperature,
      });
      const content = (chatCompletion.choices[0]?.message?.content || '').trim();
      if (content) {
        return content;
      }
      console.warn(`Groq attempt ${attempt}/${maxRetries}: empty model response, retrying...`);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      if (errMsg.includes('model output must contain either output text or tool calls') && attempt < maxRetries) {
        console.warn(`Groq attempt ${attempt}/${maxRetries}: model output error, retrying...`);
      } else {
        throw error;
      }
    }
    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Groq failed to generate a valid response after multiple retries.');
}

const KEYWORD_POOL = [
  'QA',
  'MCP',
  'RAG',
  'LLM',
  'AI Agents',
  'n8n',
  'LangFlow',
  'Crew AI',
  'DeepEval',
  'LangChain',
  'AI Harness',
  'LLM Eval',
];

// Helper to get today's date in YYYY-MM-DD local time
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Agent 1 - Topic Generator
 * Selects a keyword from the pool, ensures it has not been covered,
 * generates a technical LinkedIn post topic title using Groq,
 * and appends a new row with Status="Pending".
 */
export async function runAgent1TopicGenerator(): Promise<ContentRow> {
  const today = getTodayDateString();
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not defined in environment.');
  }

  // 1. Read existing rows to avoid repeating topics and check if today is already done
  const rows = await excelManager.readRows();
  const existingTopics = rows.map((r) => r.topic.toLowerCase());

  // Check if today already has a row
  const todayRow = rows.find((r) => r.date === today);

  // Filter out keywords that have already been used in existing topics
  let availableKeywords = KEYWORD_POOL.filter((kw) => {
    return !existingTopics.some((topic) => topic.includes(kw.toLowerCase()));
  });

  // Fallback if all keywords have been used: reset and use full pool
  if (availableKeywords.length === 0) {
    console.log('All keywords in pool used. Resetting available keywords.');
    availableKeywords = KEYWORD_POOL;
  }

  // Select a random keyword from available ones
  const selectedKeyword = availableKeywords[Math.floor(Math.random() * availableKeywords.length)];

  // Use Groq to generate a catchy engineering-focused topic title based on the keyword
  const groq = new Groq({ apiKey: groqKey });
  const prompt = `You are a technical content planner. Choose the keyword "${selectedKeyword}" and write one short, catchy, professional LinkedIn post topic title (under 10 words) about it. 
The title should be technical and appeal directly to software developers, devops, or QA engineers.
Avoid repeating any of these existing topic ideas: [${rows.map((r) => r.topic).join(', ')}].

Output ONLY the topic title itself. Do not include quotes, introductions, markdown bolding, or numbering.`;

  const rawTopic = await callGroqWithRetry(
    groq,
    [{ role: 'user', content: prompt }],
    'llama-3.3-70b-versatile',
    0.7
  );

  const generatedTopic = rawTopic.replace(/^"(.*)"$/, '$1');

  if (!generatedTopic) {
    throw new Error('Groq failed to generate a topic title.');
  }

  // 2. Append/update row in spreadsheet
  const newRow: Partial<ContentRow> = {
    topic: generatedTopic,
    status: 'Pending' as ContentStatus,
    linkedInPost: todayRow?.linkedInPost || '',
    linkedInImage: todayRow?.linkedInImage || '',
    errorLog: '',
  };

  await excelManager.updateRow(today, newRow, 'Agent 1 (Topic Generator)');

  return {
    date: today,
    topic: generatedTopic,
    status: 'Pending',
    linkedInPost: todayRow?.linkedInPost || '',
    linkedInImage: todayRow?.linkedInImage || '',
    errorLog: '',
  };
}

/**
 * Agent 2 - Content Writer
 * Reads today's row, generates LinkedIn post copy using Groq,
 * and sets Status="Imaging".
 */
export async function runAgent2ContentWriter(): Promise<ContentRow> {
  const today = getTodayDateString();
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not defined in environment.');
  }

  // Read row for today
  const rows = await excelManager.readRows();
  const todayRow = rows.find((r) => r.date === today);
  if (!todayRow) {
    throw new Error(`No topic row found for today's date (${today}). Run Agent 1 first.`);
  }

  // Set status to Writing
  await excelManager.updateRow(today, { status: 'Writing' }, 'Agent 2 (Content Writer)');

  const groq = new Groq({ apiKey: groqKey });
  const prompt = `You are a direct, opinionated, and highly technical software engineer writing a LinkedIn post.
Write a post about: "${todayRow.topic}".

Follow these constraints strictly:
1. Tone: Technical, direct, developer-oriented.
2. Structure: Start with a strong attention-grabbing hook. Use short paragraphs. Use a real example if possible.
3. Exclusions: Do NOT use filler words or phrases like "game-changer", "dive deep", "revolutionize", "harness", "delve into", "in this post", "look no further".
4. Length: Approximately 150 to 200 words.
5. Return ONLY the copy of the post. Do not include markdown code block syntax (like \`\`\`), greetings, or conversational filler before or after the post.`;

  const generatedPost = await callGroqWithRetry(
    groq,
    [{ role: 'user', content: prompt }],
    'llama-3.3-70b-versatile',
    0.6
  );

  if (!generatedPost) {
    throw new Error('Groq failed to generate LinkedIn post content.');
  }

  // Update row in spreadsheet
  const updatedRow: Partial<ContentRow> = {
    linkedInPost: generatedPost,
    status: 'Done' as ContentStatus,
    errorLog: '',
  };

  await excelManager.updateRow(today, updatedRow, 'Agent 2 (Content Writer)');

  return {
    ...todayRow,
    ...updatedRow,
  };
}



/**
 * Checks sanity/health of both API keys
 */
export async function checkApiKeyHealth() {
  const status = { groq: false, gemini: false };
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      // Simple models list call to verify validity
      await groq.models.list();
      status.groq = true;
    } catch (e) {
      console.error('Groq key validation failed:', e);
    }
  }

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      // Verify with a lightweight text completion (not image generation)
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'ping',
      });
      status.gemini = true;
    } catch (e) {
      console.error('Gemini key validation failed:', e);
    }
  }

  return status;
}
