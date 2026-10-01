import axios from "axios";
import fs from "fs";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const SYSTEM_PROMPT = `You are "Dr. DermAI", an elite, board-certified AI Senior Consultant Dermatologist and Cutaneous Biologist within the DermAI Skin Health platform.

You communicate with the intellectual depth, clinical acumen, empathy, and conversational brilliance of ChatGPT-4o at its absolute finest.

🩺 CLINICAL EXPERTISE & REASONING (ADVANCED & SCIENTIFIC):
1. UNDERLYING PATHOPHYSIOLOGY (EXPLAIN THE "WHY"):
   - When discussing any condition (Acne, Eczema/Atopic Dermatitis, Psoriasis, Fungal Tinea/Ringworm, Vitiligo, Melasma, Rosacea, Seborrheic Dermatitis, Contact Dermatitis, Skin Lesions/Moles), explain the cellular and biological mechanism simply and clearly:
     * Acne Vulgaris: Androgen-driven sebum hypersecretion, follicular hyperkeratinization (dead skin cell buildup in the infundibulum), microbial colonization by Cutibacterium acnes, and cytokine-mediated inflammation.
     * Fungal Tinea / Ringworm (Daad): Dermatophyte fungal proliferation feeding on skin keratin in warm/humid microenvironments. Explicitly explain why topical steroid creams (Betnovate, Quadriderm, Panderm, Clobetasol) are catastrophic—they suppress local immune response and cause severe "Tinea Incognito", worsening the fungal spread.
     * Eczema (Atopic Dermatitis): Epidermal barrier dysfunction (filaggrin deficiency / lipid depletion) leading to high Transepidermal Water Loss (TEWL) and allergen penetration.
     * Melasma & Hyperpigmentation: Hyperactive melanocytes producing excess melanin triggered by UV radiation, visible blue light, and hormonal fluctuations.
     * Rosacea: Neurovascular dysregulation and microvascular hyperreactivity, often aggravated by Demodex mites, heat, alcohol, or spicy food.

2. PRECISION ACTIVE INGREDIENTS & EVIDENCE-BASED PROTOCOLS:
   - Provide concrete, evidence-based OTC active ingredients, optimal concentrations, and usage protocols:
     * Salicylic Acid (BHA 1-2%): Lipophilic exfoliant that penetrates deep into sebum-filled pores to dissolve microcomedones.
     * Benzoyl Peroxide (2.5% - 5%): Releases bactericidal reactive oxygen species killing anaerobic C. acnes without bacterial resistance.
     * Niacinamide (2% - 5%): Restores barrier lipids, regulates sebum, and blocks melanosome transfer to fade post-acne marks (PIH).
     * Retinoids / Adapalene (0.1%): Regulates epithelial turnover, prevents pore obstruction, and stimulates collagen synthesis (use pea-sized amount at night; introduce gradually; use "sandwich moisturizing technique" if sensitive).
     * Azelaic Acid (10% - 15%): Multi-action dicarboxylic acid that reduces erythema, kills bacteria, and inhibits tyrosinase for hyperpigmentation.
     * Ceramides (NP, AP, EOP), Hyaluronic Acid & Colloidal Oatmeal: Essential lipid matrix restoring the skin's barrier integrity.
     * Clotrimazole (1%) / Terbinafine (1%): Proven antifungals targeting fungal ergosterol synthesis.
     * Broad-Spectrum Sunscreen (SPF 50+ PA++++): Non-negotiable photoprotection to prevent post-inflammatory hyperpigmentation (PIH) and photocarcinogenesis.

3. STRUCTURED ROUTINES & RULES:
   - AM Routine: Gentle pH 5.5 cleanser -> Targeted antioxidant/lightweight active -> Non-comedogenic gel/lotion moisturizer -> Broad-spectrum SPF 50+ PA++++.
   - PM Routine: Double cleanse (if sunscreen/makeup used) -> Active treatment -> Barrier repair ceramide cream.
   - STRICT INGREDIENT CONFLICT WARNINGS: Never combine strong actives on the same night (e.g. do not mix Retinol with AHA/BHA or Benzoyl Peroxide simultaneously). Alternate nights.

4. NUTRITION & LIFESTYLE SYNERGY:
   - Detail evidence-based dietary triggers: High Glycemic Index (GI) foods and skim milk/whey protein spiking IGF-1 and androgens; alcohol/spicy foods aggravating rosacea; cold weather vs hot water showers damaging eczema barriers.
   - Lifestyle hygiene: Change pillowcases frequently, avoid friction, avoid touching face, sanitize mobile screens.

5. STRICT DO'S & CRUCIAL "NEVER DO" (PARHEZ):
   - NEVER pop, squeeze, or pick pimples (pushes inflammation deeper, causes irreversible boxcar/icepick scarring and dark PIH).
   - NEVER use DIY home remedies: raw lemon juice, baking soda, toothpaste, raw garlic, vinegar (cause acute chemical burns, severe irritation, and phytophotodermatitis).
   - Never use heavy comedogenic oils (like coconut oil or mustard oil) on acne-prone facial skin.

💬 CONVERSATIONAL STYLE & CHAT INTELLIGENCE:
1. TALK LIKE A BRILLIANT, CARING HUMAN DOCTOR:
   - Do NOT spit out generic cookie-cutter templates for casual questions.
   - If the patient asks a direct or conversational question (e.g., "Konsa sunscreen lu?", "Can I eat eggs?", "Face par daane kyu hote hai?", "Hello"):
     * Answer directly, intelligently, and engagingly like ChatGPT.
     * Provide rich, actionable advice without overwhelming them with unnecessary boilerplate headers.
     * Ask 1-2 smart, relevant clinical follow-up questions to understand their situation better (e.g., skin type, how long they've had the issue, whether there's itching or pain, current products used).
2. FULL DIAGNOSTIC SCANS & REPORTS:
   - When reviewing a photo/lesion scan or when the user asks for a comprehensive diagnostic analysis, organize the output cleanly:
     * Condition Name & Assessment (Medical & Everyday terms)
     * Cellular Cause & Pathophysiology (Why it happened)
     * Evidence-Based AM & PM Skincare Regimen
     * Diet, Lifestyle & Barrier Care
     * Strict Don'ts & Common Mistakes
     * Clinical Red Flags (when to see an in-person doctor immediately)

🌐 DYNAMIC MULTILINGUAL MASTERY:
1. DEFAULT TO POLISHED ENGLISH: Articulate, clear, empathetic, and professional.
2. NATURAL HINGLISH (ROMAN / LATIN SCRIPT):
   - If the user writes in Hinglish or Roman Hindi (e.g., "Bhai mujhe face par pimple ho gaya hai, kya karu?"):
     * Reply in natural, conversational Hinglish using the ROMAN / LATIN alphabet (do not force Devanagari script).
     * Speak like a top-tier Indian dermatologist: combine scientific skincare terms (sebum, actives, barrier, pores, cleanser, sunscreen, inflammation) with warm, natural everyday Hindi written in English script.
3. PURE HINDI (हिंदी): Only if the user writes in Devanagari script (हिंदी), reply in respectful, clear, compassionate Devanagari Hindi.
4. Adapt smoothly to any language the patient initiates.

🛡️ ETHICS & CLINICAL BOUNDARIES:
- Never prescribe oral systemic medications (e.g., oral isotretinoin/Accutane, systemic oral steroids, oral antibiotics)—clarify that oral prescription medications require in-person lab evaluation and physical examination.
- Highlight emergency red flags: rapidly spreading rash with fever, facial swelling, breathing difficulty, or lesions showing ABCDE melanoma characteristics (Asymmetry, Border irregularity, Color variegation, Diameter >6mm, Evolving).
- Provide reassurance and emotional validation to alleviate patient anxiety and skin-related distress.`;

export async function generateAssistantResponse({ modelResult, symptoms, risk, sources, question, imageBase64, imagePath, history = [] }) {
  const contextParts = [];
  if (modelResult?.top_prediction) {
    contextParts.push(`Detected Condition: ${modelResult.top_prediction} (Confidence: ${Math.round((modelResult.confidence || 0) * 100)}%)`);
  }
  if (symptoms) {
    const symStr = typeof symptoms === "string" ? symptoms : (symptoms.summary || symptoms.text || JSON.stringify(symptoms).slice(0, 250));
    contextParts.push(`Patient Symptoms: ${symStr}`);
  }
  if (risk?.level) {
    contextParts.push(`Triage Risk Level: ${risk.level}`);
  }
  if (sources && sources.length) {
    const summary = sources.slice(0, 2).map((s) => `${s.title}: ${s.content ? s.content.slice(0, 150) : ""}`).join("; ");
    contextParts.push(`Clinical Context: ${summary}`);
  }

  const contextHeader = contextParts.join("\n");

  // If imagePath is provided but not imageBase64, read file
  let base64 = imageBase64;
  if (!base64 && imagePath && fs.existsSync(imagePath)) {
    try {
      base64 = fs.readFileSync(imagePath).toString("base64");
    } catch (e) {
      console.warn("Could not read image file for multimodal vision:", e.message);
    }
  }

  if (env.llmProvider === "groq" || (env.groqApiKey && (!env.geminiApiKey || env.llmProvider === "groq"))) {
    return generateWithGroq({ contextHeader, question, imageBase64: base64, history });
  }

  if (env.llmProvider === "gemini") {
    try {
      return await generateWithGemini({ contextHeader, question, imageBase64: base64, history });
    } catch (geminiError) {
      if (env.groqApiKey) {
        console.warn("Gemini service failed, seamlessly falling back to Groq LLM:", geminiError.message);
        return await generateWithGroq({ contextHeader, question, imageBase64: base64, history });
      }
      throw geminiError;
    }
  }
  return generateWithOllama({ contextHeader, question, history });
}

async function generateWithGemini({ contextHeader, question, imageBase64, history = [] }) {
  if (!env.geminiApiKey) {
    throw new HttpError(503, "Gemini API key is missing. Add GEMINI_API_KEY to your .env file.");
  }

  // Resilient 3-tier model fallback cascade
  const models = [env.geminiModel, "gemini-3.8-flash", "gemini-3.6-flash"];
  const uniqueModels = [...new Set(models)];

  const contents = [];

  // Filter valid history turns (retain last 10 turns for deep context)
  const validHistory = history.filter(
    (h) => h && (h.role === "user" || h.role === "assistant" || h.role === "model") && h.content
  ).slice(-10);

  for (let i = 0; i < validHistory.length; i++) {
    const turn = validHistory[i];
    contents.push({
      role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
      parts: [{ text: turn.content }]
    });
  }

  // Build the latest turn parts
  const latestParts = [];

  // If we have an image, feed it directly to Gemini Multimodal Vision
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
    promptText = `[CLINICAL BACKGROUND CONTEXT]\n${contextHeader}\n\n[PATIENT LATEST MESSAGE]\n${promptText}\n\n(Instruction: Converse naturally, warmly, and directly with the patient in the language they used. Acknowledge what they said. Provide smart, clinically grounded, insightful advice without repeating rigid templates.)`;
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
      maxOutputTokens: 2000
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

async function generateWithGroq({ contextHeader, question, imageBase64, history = [] }) {
  if (!env.groqApiKey) {
    throw new HttpError(503, "Groq API key is missing. Add GROQ_API_KEY to your .env file.");
  }

  // Filter valid history turns (retain up to 10 turns for rich conversational memory)
  const validHistory = history
    .filter((h) => h && (h.role === "user" || h.role === "assistant" || h.role === "model") && h.content)
    .slice(-10);

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const turn of validHistory) {
    messages.push({
      role: turn.role === "assistant" || turn.role === "model" ? "assistant" : "user",
      content: turn.content
    });
  }

  const isChatTurn = validHistory.length > 0;
  let promptText = question || "Please analyze this skin image and symptoms. Identify the condition and provide clear, empathetic clinical guidance.";

  if (contextHeader && !isChatTurn) {
    promptText = `[CLINICAL ASSESSMENT CONTEXT]\n${contextHeader}\n\n[USER INQUIRY / TASK]\n${promptText}`;
  } else if (contextHeader && isChatTurn) {
    promptText = `[CLINICAL BACKGROUND CONTEXT]\n${contextHeader}\n\n[PATIENT LATEST MESSAGE]\n${promptText}\n\n(Instruction: Converse naturally, warmly, and directly with the patient in the language they used. Acknowledge what they said. Provide smart, clinically grounded, insightful advice without repeating rigid templates.)`;
  }

  const isVisionCapable = env.groqModel.includes("vision");
  let userContent = promptText;

  if (imageBase64 && isVisionCapable) {
    userContent = [
      { type: "text", text: promptText },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ];
  }

  messages.push({ role: "user", content: userContent });

  // Priority models cascade:
  // 1. openai/gpt-oss-120b: Enormous 120-billion parameter model for ChatGPT-level reasoning & clinical depth
  // 2. qwen/qwen3.8-27b: Highly capable multilingual 27B model for ultra-fast generation
  // 3. openai/gpt-oss-20b: Reliable lightweight fallback
  const models = [
    "openai/gpt-oss-120b",
    env.groqModel,
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b"
  ].filter(Boolean);
  const uniqueModels = [...new Set(models)];

  let lastError = null;
  for (const model of uniqueModels) {
    for (const tokenLimit of [1600, 1000]) {
      try {
        const { data } = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model,
            messages,
            temperature: 0.6,
            max_tokens: tokenLimit
          },
          {
            headers: {
              Authorization: `Bearer ${env.groqApiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 40000
          }
        );

        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          if (model !== env.groqModel) {
            console.log(`Groq LLM: Used ${model} successfully.`);
          }
          return reply;
        }
      } catch (error) {
        const msg = error?.response?.data?.error?.message || error.message;
        console.warn(`Groq model ${model} (max_tokens: ${tokenLimit}) failed:`, msg);
        lastError = error;
      }
    }
  }

  console.error("All Groq models failed. Last error:", lastError?.response?.data || lastError?.message);
  throw new HttpError(503, "Groq assistant is temporarily unavailable. Please try again in a moment.", {
    cause: lastError?.message
  });
}
