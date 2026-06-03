import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payloads for PDF scans and high-res whiteboard board captures
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with User-Agent required for telemetries
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for model fallback when API Key is missing or invalid
function checkApiKey(res: express.Response) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(400).json({
      error: "Missing GEMINI_API_KEY. Please provide this key in the Settings > Secrets menu."
    });
    return false;
  }
  return true;
}

// ==========================================
// AI ENDPOINTS
// ==========================================

/**
 * 1. Process Lecture Transcript & Board notes to format comprehensive Notes
 */
app.post("/api/ai/process-lecture", async (req, res) => {
  if (!checkApiKey(res)) return;
  const { transcript, boardNotes, subject } = req.body;

  try {
    const prompt = `You are an elite academic editor. Given this lecture transcript and optional board/slide elements, generate highly organized Apple-Notes quality study materials.
Follow these rigid output formatting instructions:
1. Under "generatedNotes", write comprehensive and beautifully structured markdown documentation. Use headings, spacing, and bullet points. Highlight critical exam takeaways as: ★ EXAM HINT: text ★.
2. Under "formulas", extract important equations in clean LaTeX notation and describe each.
3. Under "qa", define challenging questions and solutions for practice.
4. Under "summary", summarize the class core message in a tidy 3-4 sentence paragraph.

Subject requested: ${subject || "Unknown"}
Transcript code: "${transcript}"
Board notes metadata: "${boardNotes || "None"} "`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generatedNotes: { 
              type: Type.STRING, 
              description: "Full organized markdown documentation of notes. Must include ★ EXAM HINT: [takeaway] ★ blocks for key ideas. Also flag unclear transcript areas with [unclear — verify]." 
            },
            summary: { type: Type.STRING, description: "Tidy summary paragraph." },
            formulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expression: { type: Type.STRING, description: "LaTeX equation syntax (e.g. \\Delta x \\Delta p \\ge \\frac{\\hbar}{2})" },
                  description: { type: Type.STRING, description: "Short formula title and name" },
                  context: { type: Type.STRING, description: "Specific use case or condition" }
                },
                required: ["expression", "description"]
              }
            },
            qa: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            },
            subject: { type: Type.STRING, description: "Inferred class category: Physics, Chemistry, Maths, Biology or Other" }
          },
          required: ["generatedNotes", "summary", "formulas", "qa", "subject"]
        }
      }
    });

    if (!response.text) throw new Error("Empty AI text generated");
    res.json(JSON.parse(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. Visual Whiteboard & Board Photo OCR Scanner
 */
app.post("/api/ai/ocr", async (req, res) => {
  if (!checkApiKey(res)) return;
  const { base64Image, mimeType } = req.body;

  try {
    const prompt = `Perform extensive handwriting OCR recognition on this classroom board/slide snapshot. 
Carefully extract:
1. Full structural board text transcription.
2. Detailed Formula extraction matching LaTeX mathematical notation.
3. Logical content analysis describing what was on the board.

Be extremely precise. Correct drawing glitches or unclear visual items. Return results as structured JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/png",
            data: base64Image,
          },
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING, description: "Complete linear OCR text block transcribed cleanly from the photo" },
            formulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expression: { type: Type.STRING, description: "Parsed LaTeX formula text (e.g. F = G \\frac{m_1 m_2}{r^2})" },
                  description: { type: Type.STRING, description: "What this parsed formula represents" }
                }
              }
            },
            boardTopic: { type: Type.STRING, description: "Core academic topic depicted" }
          },
          required: ["extractedText", "formulas", "boardTopic"]
        }
      }
    });

    if (!response.text) throw new Error("OCR transcription returned empty");
    res.json(JSON.parse(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Transcribe Audio (Voice Lectures or Dictated Notes)
 * Uses multimodal Gemini to digest audio binaries directly and accurately.
 */
app.post("/api/ai/transcribe-audio", async (req, res) => {
  if (!checkApiKey(res)) return;
  const { base64Audio, mimeType } = req.body;

  try {
    const prompt = `Transcribe this academic recording into structured text. 
Format as chronological lecture speech segments. Incorporate [Speaker A] and [Speaker B] speaker labels if appropriate.
Also, output timestamps in seconds (e.g. "0:04", "1:15") wherever structural segments shift.
Correct any fuzzy audio jargon into precise math, scientific, or academic terms. Return JSON data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: base64Audio,
          },
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullTranscript: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: "E.g. Professor, Student, or Speaker A" },
                  startTime: { type: Type.INTEGER, description: "Segment start in whole seconds" },
                  endTime: { type: Type.INTEGER, description: "Segment end in whole seconds" },
                  text: { type: Type.STRING }
                },
                required: ["startTime", "endTime", "text"]
              }
            }
          },
          required: ["fullTranscript", "segments"]
        }
      }
    });

    if (!response.text) throw new Error("Audio analysis returned empty");
    res.json(JSON.parse(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Academic Memory Synthesis & Retrieval
 * Unified knowledge architecture to run retrieval queries across entire knowledge index.
 */
app.post("/api/ai/memory-assistant", async (req, res) => {
  if (!checkApiKey(res)) return;
  const { query, databaseSnapshot } = req.body;

  try {
    const prompt = `You are the Academic Memory Assistant. This is the student's retrieval search query: "${query}"

Below is a curated text snapshot of relevant items from their personal knowledge store (Lectures, Papers, Experimental Notes, Formulas, Q&As):
${JSON.stringify(databaseSnapshot, null, 2)}

Provide a highly intellectual, comprehensive synthesized answer addressing their query.
Return the response in a rigid JSON format following this schema exactly:
{
  "answer": "An elegant, comprehensive Markdown response synthesize-analyzing the student's learning history and core concept definition. Address the exact materials they have worked with.",
  "takeaways": ["3-5 prominent bullet point learning takeaways to master"],
  "referencedFormulas": [{"expression": "LaTeX formula", "description": "Short explanation", "context": "Source file metadata"}],
  "sources": [{"id": "Item ID", "type": "lecture|paper|note", "title": "Reference Item name"}]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            referencedFormulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  expression: { type: Type.STRING },
                  description: { type: Type.STRING },
                  context: { type: Type.STRING }
                }
              }
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING }
                }
              }
            }
          },
          required: ["answer", "takeaways", "referencedFormulas", "sources"]
        }
      }
    });

    if (!response.text) throw new Error("Memory retrieval synthesis failed");
    res.json(JSON.parse(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Analytical PDF Reader & metadata extraction
 */
app.post("/api/ai/process-paper", async (req, res) => {
  if (!checkApiKey(res)) return;
  const { textExcerpt, originalName } = req.body;

  try {
    const prompt = `Analyze this paper text snippet or document file and extract essential publication index fields.
Document name: "${originalName || "Unknown paper"}"
Text excerpt: "${textExcerpt ? textExcerpt.slice(0, 15000) : "Unavailable"}"

Provide academic metadata and a comprehensive literature summary inside valid JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Precise title of the academic paper" },
            authors: { type: Type.STRING, description: "Authors list (comma separated)" },
            doi: { type: Type.STRING, description: "Official DOI format (e.g. 10.1103/PhysRevLett.116.061102) if found, otherwise blank" },
            journal: { type: Type.STRING, description: "Publishing journal or conference (e.g. Nature, IEEE)" },
            year: { type: Type.STRING, description: "Publication year" },
            abstractSummary: { type: Type.STRING, description: "Deep 1-paragraph explanation of the research problem, methodology, and breakthrough findings." },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 concise tag words describing this paper's field" }
          },
          required: ["title", "authors", "doi", "journal", "year", "abstractSummary", "suggestedTags"]
        }
      }
    });

    if (!response.text) throw new Error("Paper analysis failed");
    res.json(JSON.parse(response.text));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// STATIC ASSET SERVING & VITE
// ==========================================

async function startServer() {
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
    console.log(`[AcademicOS Server] Listening dynamically on http://0.0.0.0:${PORT}`);
  });
}

startServer();
