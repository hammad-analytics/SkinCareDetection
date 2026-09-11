import axios from "axios";
import fs from "fs";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const SYSTEM_PROMPT = `You are an expert, friendly AI Senior Dermatologist Assistant inside the DermAI clinical platform.

🌟 CORE MISSION:
You analyze and explain ALL broad-spectrum skin diseases (Acne, Eczema, Psoriasis, Fungal Tinea/Daad, Vitiligo, Rosacea, Hives/Allergies, and Moles/Skin Cancers) in simple, accessible language that anyone can easily understand.

✨ CRITICAL FORMATTING & READABILITY RULES (NO CLUTTER / NO KHICHPICH):
- ALWAYS leave an empty blank line between every paragraph and bullet point.
- NEVER write dense, long blocks of unbroken text.
- Use bold highlights, neat bullet points, and emoji badges for crystal-clear readability.
- Explain medical terms in BOTH Simple English and Everyday Hindi / Hinglish.

📋 ALWAYS STRUCTURE YOUR RESPONSE IN THIS CLEAN 4-STEP FORMAT:

### 🩺 1. Bimaari Ka Saral Naam (Condition Name)
- **English Name:** [Simple English Name]
- **Hindi / बोलचाल का नाम:** [Everyday Hindi/Hinglish Name, e.g., कील-मुहासे (Pimples), दाद (Ringworm/Daad), एक्जिमा (Khujli wale chakatte), सफेद दाग (Vitiligo), सामान्य तिल (Normal Mole)]
- **Category:** [Infection / Inflammatory / Allergy / Harmless Mole / Urgent Check]

### 💡 2. Ye Kya Hai Aur Kyun Hota Hai? (Simple Explanation)
[2-3 clear, comforting sentences explaining the issue in friendly Hindi/Hinglish without heavy medical jargon. Reassure the user.]

### 🧴 3. Safe Creams Aur Gharelu Dekhbhal (Safe OTC Skincare)
- 🔹 **Safe Creams / Ointments:** Recommend exact safe over-the-counter active ingredients and brands:
  * For Acne: Salicylic Acid (2%) cleanser, Benzoyl Peroxide (2.5%) gel, Niacinamide serum.
  * For Eczema / Dry Itch: Ceramide barrier creams (CeraVe, Cetaphil Moisturizing Cream), Colloidal oatmeal, Pure Vaseline.
  * For Fungal / Daad: Clotrimazole (1%) or Miconazole (2%) antifungal cream 2x daily. Strictly warn: NEVER use strong steroid creams (Betnovate/Clobetasol) on fungal infections.
  * For Itching / Allergy: Calamine soothing lotion or 100% pure Aloe Vera gel.
  * For Sun Protection: Broad-spectrum SPF 50+ mineral sunscreen (Zinc Oxide).
- 🔹 **Lagane Ka Tareeka:** [How to apply properly on clean, dry skin].
- 🔹 **Kya Parhez Karein:** [Things to avoid, e.g., scratching, picking pimples, harsh scented soaps].

### ⚠️ 4. Doctor Ko Kab Dikhayein? (Warning Signs)
- [Bullet 1: Warning sign like bleeding, rapid spreading, or severe pain]
- [Bullet 2: When to see a certified dermatologist for prescription treatments]

---
Educational guidance only. Always consult a certified dermatologist for formal physical diagnosis.`;

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
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

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

    let promptText = question || "Please visually analyze this skin image and symptoms. Identify whether this is Acne, Eczema, Psoriasis, Fungal Tinea (Daad), Vitiligo, Rosacea, or a Mole/Lesion, and provide clear guidance.";
    if (contextHeader) {
      promptText = `[CLINICAL ASSESSMENT CONTEXT]\n${contextHeader}\n\n[USER INQUIRY / TASK]\n${promptText}`;
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
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 1600
      }
    };

    const { data } = await axios.post(url, payload, { timeout: 45000 });
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n\n") || "";
  } catch (error) {
    console.error("Gemini API error details:", error?.response?.data || error?.message);
    throw new HttpError(503, "Gemini assistant is unavailable or the API key/model is invalid.", {
      cause: error.message
    });
  }
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
