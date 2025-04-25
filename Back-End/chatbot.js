// src/chatbot.js
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const API_URL = process.env.GOOGLE_GEMINI_API_URL;   // e.g. https://generativelanguage.googleapis.com/v1beta/models
const MODEL   = process.env.GOOGLE_GEMINI_API_MODEL; // e.g. "gemini-pro"

if (!API_KEY || !API_URL || !MODEL) {
  console.error("Missing config:", { API_KEY: !!API_KEY, API_URL: !!API_URL, MODEL: !!MODEL });
  throw new Error("Missing Google Gemini configuration");
}

const FULL_API_URL = `${API_URL.replace(/\/+$/, "")}/${MODEL}:generateContent?key=${API_KEY}`;

/**
 * Formats raw AI text into either:
 *  - Plain cleaned text (if <3 non-empty sentences),
 *  - Numbered points (if ≥3 non-empty sentences).
 */
function formatResponsePlainText(text) {
  // 1) Clean markdown/html and normalize whitespace
  const cleaned = text
    .replace(/[*#]/g, "")
    .replace(/<\/?(b|i|ul|ol|li)>/gi, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2) Split into sentences on punctuation (.?!), filter out empties
  const rawSentences = cleaned.split(/(?<=[.?!])\s+/);
  const sentences = rawSentences
    .map(s => s.trim())
    .filter(s => s.length > 0 && /[A-Za-z0-9]/.test(s)); // remove empties or punctuation-only

  // 3) If fewer than 3 sentences, return cleaned text
  if (sentences.length < 3) {
    return cleaned;
  }

  // 4) Otherwise, format each as numbered point (one per line)
  return sentences
    .map((s, i) => {
      // strip any existing leading bullet/number
      const withoutLeading = s.replace(/^\s*(?:\d+\.|[-*+])\s*/, "");
      return `${i + 1}. ${withoutLeading}`;
    })
    .join("\n");
}

/**
 * Convert chat history into Gemini API format.
 */
function formatHistoryForGemini(history = []) {
  const filtered = history
    .filter(m => m.role !== "error" && m.content)
    .map(m => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Merge consecutive same-role messages
  return filtered.reduce((acc, msg) => {
    const last = acc[acc.length - 1];
    if (last && last.role === msg.role) {
      last.parts = msg.parts;
    } else {
      acc.push(msg);
    }
    return acc;
  }, []);
}

/**
 * Main: sends prompt+history to Gemini and returns formatted answer.
 */
export async function generateChatbotAnswer(prompt, history = []) {
  const messages = formatHistoryForGemini(history);
  messages.push({ role: "user", parts: [{ text: prompt }] });

  const payload = { contents: messages };

  const resp = await fetch(FULL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await resp.json();
  if (!resp.ok) {
    const errMsg = json.error?.message || `${resp.status} ${resp.statusText}`;
    throw new Error(`Gemini API Error: ${errMsg}`);
  }

  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== "string") {
    throw new Error("Unexpected Gemini response structure");
  }

  return { answer: formatResponsePlainText(raw) };
}
