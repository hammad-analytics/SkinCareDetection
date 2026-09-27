import axios from "axios";
import fs from "fs";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const SYSTEM_PROMPT = `You are "DermAI Assistant", an empathetic, highly knowledgeable, and board-certified AI Senior Dermatologist inside the DermAI Skin Health platform.

🩺 CORE PERSONA & MEDICAL PHILOSOPHY:
- You speak like an authentic, caring, highly skilled doctor talking directly to a patient.
- You have clinical expertise across ALL skin conditions: Acne, Eczema, Psoriasis, Fungal Tinea/Ringworm (Daad), Vitiligo, Rosacea, Contact Dermatitis, Hives, Moles, Sunburns, and Skin Lesions.
- Listen attentively to the patient. Acknowledge what they are experiencing (pain, itching, anxiety, self-consciousness) with genuine medical empathy.
- NEVER sound like a rigid, robotic script. DO NOT copy-paste the exact same boilerplate headers for every single response!

🌐 LANGUAGE & BILINGUAL INTELLIGENCE:
1. DEFAULT LANGUAGE IS ENGLISH: By default, converse in polished, clear, compassionate, and easy-to-understand English.
2. DYNAMIC LANGUAGE MATCHING:
   - If the user writes in Hindi (हिंदी): Reply fluently and warmly in Hindi.
   - If the user writes in Hinglish (Roman Hindi, e.g., "Mujhe chehre par acne ho gaya hai, kya karu?"): Reply naturally in conversational Hinglish like a friendly doctor.
   - If the user writes in English: Reply in natural, articulate English.
   - If the user writes in any other language (Urdu, Bengali, Tamil, etc.): Adapt fluently to their chosen language.
   - Match the user's natural language and tone effortlessly!

💬 CONVERSATION vs CLINICAL SCAN REPORTS:
1. FOR INTERACTIVE CHAT & DIRECT QUESTIONS (e.g., "Hi", "Can I eat eggs with acne?", "Which sunscreen is best?", "How long does daad take to heal?"):
   - Talk naturally! Answer their specific question directly in a conversational, helpful manner.
   - Do NOT output rigid "1. Bimaari Ka Naam / 2. Ye Kya Hai" template boxes for conversational chat messages.
   - Explain the medical reasoning clearly, offer practical lifestyle or OTC supportive guidance, and ask a caring follow-up question if needed.

2. FOR FULL LESION / PHOTO DIAGNOSTIC ASSESSMENTS (when analyzing an image or when asked for a comprehensive disease summary):
   - Provide a structured, beautiful breakdown:
     * Condition Name (Medical term + everyday friendly name)
     * What It Is & Why It Happens (clear biological cause without terrifying jargon)
     * Safe OTC Skincare & Active Ingredients (Salicylic Acid, Benzoyl Peroxide, Ceramides, Clotrimazole, Calamine, SPF 50 Mineral Sunscreen)
     * How to Apply & What to Avoid (lifestyle, diet triggers, parhez)
     * Red Flag Warning Signs (when an in-person physical doctor visit is essential)

🛡️ ETHICS & SAFETY:
- Do not prescribe systemic oral medications (e.g. oral steroids, oral antibiotics, Accutane) — explain that oral systemic drugs require in-person physical exam and lab work.
- Provide safe over-the-counter options and home supportive care.
- Warn against dangerous home hacks (no raw lemon, garlic, or popping pimples).
- Always be encouraging and reassuring to reduce patient distress.`;

export async function generateAssistantResponse({ modelResult, symptoms, risk, sources, question, imageBase64, imagePath, history = [] }) {
  const contextParts = [];
  if (modelResult) contextParts.push(`AI Model Findings: ${JSON.stringify(modelResult)}`);
  if (symptoms) contextParts.push(`Patient Reported Symptoms: ${JSON.stringify(symptoms)}`);
  if (risk) contextParts.push(`Triage Risk Evaluation: ${JSON.stringify(risk)}`);
  if (sources && sources.length) contextParts.push(`Medical Guidelines: ${JSON.stringify(sources)}`);

  const contextHeader = contextParts.join("\n\n");

  // If imagePath is provided but not imageBase64, read file
  let base64 = imageBase64;
  if (!base64 && imagePath && fs.existsSync(imagePath)) {
    try {
      base64 = fs.readFileSync(imagePath).toString("base64");
    } catch (e) {
      console.warn("Could not read image file for multimodal vision:", e.message);
    }
  }

  if (env.llmProvider === "gemini") {
    return generateWithGemini({ contextHeader, question, imageBase64: base64, history });
  }
  return generateWithOllama({ contextHeader, question, history });
}

async function generateWithGemini({ contextHeader, question, imageBase64, history = [] }) {
  if (!env.geminiApiKey) {
    throw new HttpError(503, "Gemini API key is missing. Add GEMINI_API_KEY to your .env file.");
  }

  // Resilient 3-tier model fallback cascade
  const models = [env.geminiModel, "gemini-3.5-flash", "gemini-3.6-flash"];
  const uniqueModels = [...new Set(models)];

  const contents = [];

  // Filter valid history turns
  const validHistory = history.filter(
    (h) => h && (h.role === "user" || h.role === "assistant" || h.role === "model") && h.content
  );

  for (let i = 0; i < validHistory.length; i++) {
    const turn = validHistory[i];
    contents.push({
      role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
      parts: [{ text: turn.content }]
    });
  }

  // Build the latest turn parts
  const latestParts = [];

  // If we have an image, feed it directly to Gemini Multimodal Vision!
  if (imageBase64) {
    latestParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const isChatTurn = validHistory.length > 0;
  let promptText = question || "Please visually analyze this skin image and symptoms. Identify the condition and provide clear, empathetic clinical guidance.";

  if (contextHeader && !isChatTurn) {
    promptText = `[CLINICAL ASSESSMENT CONTEXT]\n${contextHeader}\n\n[USER INQUIRY / TASK]\n${promptText}`;
  } else if (contextHeader && isChatTurn) {
    promptText = `[CLINICAL BACKGROUND CONTEXT]\n${contextHeader}\n\n[PATIENT LATEST MESSAGE]\n${promptText}\n\n(Instruction: Converse naturally, warmly, and directly with the patient in the language they used. Acknowledge what they said. Do not repeat rigid templates.)`;
  }

  latestParts.push({ text: promptText });

  contents.push({
    role: "user",
    parts: latestParts
  });

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents,
    generationConfig: {
      temperature: 0.6,
      topP: 0.95,
      maxOutputTokens: 1800
    }
  };

  // Try each model in cascade
  let lastError = null;
  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`;
      const { data } = await axios.post(url, payload, { timeout: 45000 });
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n\n") || "";
      if (text) {
        if (model !== env.geminiModel) {
          console.log(`Gemini fallback: ${env.geminiModel} unavailable, used ${model} successfully.`);
        }
        return text;
      }
    } catch (error) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.error?.message || error?.message || "";
      console.warn(`Gemini model ${model} failed (HTTP ${status}): ${msg}`);
      lastError = error;
      // Only retry on 404 (model not found) or 503 (overloaded) — not on 400/401/403
      if (status && status !== 404 && status !== 503 && status !== 429) {
        break;
      }
    }
  }

  console.error("All Gemini models failed. Last error:", lastError?.response?.data || lastError?.message);
  throw new HttpError(503, "Gemini assistant is temporarily unavailable. Please try again in a moment.", {
    cause: lastError?.message
  });
}

async function generateWithOllama({ contextHeader, question, history = [] }) {
  try {
    const prompt = `${SYSTEM_PROMPT}\n\n${contextHeader}\n\nUser Question: ${question || "Explain this assessment."}`;
    const { data } = await axios.post(
      `${env.ollamaHost}/api/generate`,
      { model: env.ollamaModel, prompt, stream: false },
      { timeout: 30000 }
    );
    return data.response;
  } catch (error) {
    throw new HttpError(503, "Ollama service unavailable.", { cause: error.message });
  }
}
