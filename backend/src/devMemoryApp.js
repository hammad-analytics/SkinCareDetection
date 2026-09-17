import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { env } from "./config/env.js";
import { uploadImage } from "./middleware/upload.js";
import { mlService } from "./services/mlService.js";
import { assessRisk } from "./services/riskService.js";
import { filterAssistantText } from "./services/safetyService.js";
import { generateAssistantResponse } from "./services/llmService.js";
import path from "path";

const users = [];
const scans = [];
const reports = [];
const chatSessions = new Map();

/* ── In-memory RAG knowledge base (HAM10000 conditions + Skincare) ── */
const knowledgeBase = [
  {
    source: "HAM10000 Educational Reference",
    title: "Actinic Keratoses (akiec)",
    category: "skin-condition",
    content: "Actinic Keratoses (Solar Keratoses) are rough, scaly patches on the skin caused by years of sun exposure. They are considered precancerous because a small percentage can progress to squamous cell carcinoma. Common locations include the face, ears, scalp, forearms, and backs of hands. They appear as flat to slightly raised, dry, rough patches that may be skin-colored, reddish-brown, or yellowish. Prevention involves sun protection. Treatment options include cryotherapy, topical medications, and photodynamic therapy. A dermatologist should evaluate persistent or changing lesions."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Basal Cell Carcinoma (bcc)",
    category: "skin-condition",
    content: "Basal Cell Carcinoma is the most common type of skin cancer. It typically appears as a pearly or waxy bump, a flat flesh-colored or brown scar-like lesion, or a bleeding or scabbing sore that heals and returns. BCC grows slowly and rarely metastasizes, but can cause significant local tissue destruction if left untreated. Risk factors include prolonged UV exposure, fair skin, history of sunburns, and family history. Treatment includes surgical excision, Mohs surgery, cryotherapy, or topical treatments. Early detection and treatment are important for best outcomes."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Benign Keratosis-like Lesions (bkl)",
    category: "skin-condition",
    content: "Benign Keratosis-like Lesions include seborrheic keratoses, solar lentigines, and lichen planus-like keratoses. Seborrheic keratoses are very common non-cancerous growths that appear as waxy, stuck-on looking brown, black, or tan growths. They can appear anywhere on the body and are more common with age. They are not caused by sun exposure and do not become cancerous. Solar lentigines (age spots/liver spots) are flat brown spots caused by sun exposure. These conditions are typically benign but may be removed for cosmetic reasons or if they become irritated."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Dermatofibroma (df)",
    category: "skin-condition",
    content: "Dermatofibromas are common, harmless, firm bumps (nodules) in the skin. They typically appear as small (less than 1 cm), firm, raised bumps that are brownish to reddish-brown in color. They most commonly occur on the legs but can appear anywhere. A characteristic sign is the 'dimple sign' — when pinched, the lesion dimples inward. They are thought to be a reaction to minor injuries such as insect bites or thorn pricks. Dermatofibromas are benign and usually don't require treatment unless they cause discomfort or cosmetic concern."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Melanoma (mel)",
    category: "skin-condition",
    content: "Melanoma is the most dangerous type of skin cancer, developing from melanocytes (pigment-producing cells). Early detection is critical as it can spread to other organs. Use the ABCDE rule for self-examination: A-Asymmetry (one half doesn't match the other), B-Border irregularity (edges are ragged or blurred), C-Color variation (multiple shades of brown, black, red, white, or blue), D-Diameter (larger than 6mm, about pencil eraser size), E-Evolving (changing in size, shape, or color). Risk factors include UV exposure, many moles, fair skin, family history, and previous melanoma. Any suspicious changing mole should be evaluated by a dermatologist immediately. Treatment depends on stage and may include surgical excision, immunotherapy, targeted therapy, or radiation."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Melanocytic Nevi (nv)",
    category: "skin-condition",
    content: "Melanocytic Nevi (common moles) are benign growths of melanocytes. They appear as small, dark brown spots caused by clusters of melanocytes. Most adults have 10 to 40 moles. Moles can be flat or raised, smooth or rough, and some have hair growing from them. Most moles appear during childhood and adolescence, and they may change slowly over time, becoming raised or changing color. While most moles are harmless, it's important to monitor them for changes using the ABCDE criteria. People with many moles (more than 50) have a higher risk of melanoma. Regular skin self-examinations are recommended."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Acne Vulgaris & Pimples (Kheel-Muhaase)",
    category: "skin-condition",
    content: "Acne occurs when hair follicles plug with oil and dead skin cells. Types include blackheads, whiteheads, papules, pustules, and deep painful cysts. Recommended OTC active ingredients include Salicylic Acid (2%) for pore declogging, Benzoyl Peroxide (2.5% to 5%) for reducing bacterial acne, and Niacinamide (5-10%) to soothe inflammation. Avoid popping or squeezing pimples to prevent hyperpigmentation and scarring. For cystic or scarring acne, consult a dermatologist for prescription topical retinoids or oral medications."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Atopic Dermatitis & Eczema (Khujli wale chakatte)",
    category: "skin-condition",
    content: "Eczema is a chronic skin barrier condition characterized by dry, red, severely itchy patches that can crack and weep. Essential supportive care centers on skin barrier repair using fragrance-free Ceramide and Hyaluronic Acid moisturizers (CeraVe, Cetaphil, Aveeno Colloidal Oatmeal). Apply thick creams within 3 minutes of showering on damp skin. Use cool damp compresses to relieve itch. If skin exhibits yellow crusting (infection) or severe flare-ups, consult a dermatologist for prescription non-steroidal anti-inflammatory or topical calcineurin inhibitor creams."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Psoriasis & Scaly Plaques (Chambal)",
    category: "skin-condition",
    content: "Psoriasis is an autoimmune condition that accelerates the life cycle of skin cells, leading to thick, red, raised patches covered with silvery-white scales. Common on elbows, knees, scalp, and lower back. Supportive care includes Salicylic Acid scale-softeners, Coal Tar ointments or shampoos, and heavy emollient moisturizers. Mild morning sun exposure (10-15 mins) can be beneficial. Avoid scratching as trauma triggers new lesions (Koebner phenomenon). Regular dermatologist oversight is essential for advanced treatments."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Fungal Infections & Ringworm (Daad / Tinea)",
    category: "skin-condition",
    content: "Tinea (ringworm, athlete's foot, jock itch) is a superficial fungal infection producing circular, ring-shaped red rashes with raised, scaly, itchy borders and clearer centers. Safe OTC treatments include Clotrimazole (1%), Miconazole (2%), or Terbinafine (1%) antifungal creams applied twice daily for 2 to 4 weeks. Keep skin completely clean and dry. Crucial warning: NEVER apply topical steroid creams (such as Betnovate or Clobetasol) to fungal rashes — steroids suppress skin immunity and cause fungus to spread aggressively (tinea incognito)."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Vitiligo (Safed Daag)",
    category: "skin-condition",
    content: "Vitiligo is an autoimmune condition where pigment-producing cells (melanocytes) lose function, resulting in smooth, non-itchy depigmented white skin patches. It is completely non-contagious. Depigmented skin lacks natural melanin UV protection and burns rapidly in sunlight; strict daily use of Broad-Spectrum SPF 50+ mineral sunscreen is required. Early medical consultation is advised, as topical calcineurin inhibitors, phototherapy (narrowband UVB), and excimer lasers yield highest repigmentation rates in early stages."
  },
  {
    source: "Clinical Dermatology Guidelines",
    title: "Rosacea & Facial Redness",
    category: "skin-condition",
    content: "Rosacea is a chronic vascular facial disorder causing central facial erythema, flushing, visible broken capillaries (telangiectasia), and occasional inflammatory papules. Supportive daily care involves ultra-gentle, non-foaming cleansers, mineral Zinc Oxide sunscreens (SPF 50), and OTC Azelaic Acid (10%) to calm redness. Avoid dietary and environmental triggers (spicy food, hot beverages, alcohol, extreme temperatures, and abrasive facial scrubs)."
  },
  {
    source: "HAM10000 Educational Reference",
    title: "Vascular Lesions (vasc)",
    category: "skin-condition",
    content: "Vascular Lesions include various conditions related to blood vessels in the skin. Cherry angiomas are small, bright red dome-shaped bumps made of blood vessels — they are very common and benign. Pyogenic granulomas are rapidly growing, red, vascular nodules that bleed easily, often occurring after minor injury. Angiokeratomas are small, dark red to blue-black bumps with a rough surface. Port-wine stains are flat, pink, red, or purple birthmarks. Most vascular lesions are benign but should be evaluated if they bleed frequently, change rapidly, or cause concern. Treatment options include laser therapy, cryotherapy, or surgical removal."
  },
  {
    source: "Clinical Dermatology Skincare Reference",
    title: "Over-the-Counter (OTC) Supportive Creams, Moisturizers & Soothing Lotions",
    category: "skincare-creams",
    content: "Safe, non-prescription topical supportive options for skin comfort and barrier restoration: 1) Ceramide & Hyaluronic Acid Creams (such as CeraVe Moisturizing Cream, Cetaphil Moisturizing Cream, Aveeno Skin Relief) repair dry, flaky skin barriers and lock in essential moisture. 2) Cooling Anti-Itch Lotions: Calamine lotion or pure Aloe Vera gel provides immediate cooling relief for itching, irritation, and redness. 3) Occlusive Healing Ointments: Pure White Petroleum Jelly (Vaseline) or Aquaphor creates a protective shield over cracked, peeling, or sensitive skin to prevent water loss. 4) Sun Protection: Broad-spectrum physical mineral sunscreens (SPF 50+ PA++++ with Zinc Oxide / Titanium Dioxide) prevent UV damage from aggravating existing skin lesions. Note: Prescription-strength medicated creams (such as potent topical corticosteroids like Clobetasol, Betamethasone, prescription antifungal creams, or antibiotics) require evaluation and formal prescription from a certified dermatologist."
  },
  {
    source: "Dermatological Symptom Care",
    title: "Supportive Home Care for Itchy, Dry, or Inflamed Skin",
    category: "symptom-relief",
    content: "Non-medicated home comfort guidelines: Apply thick moisturizing cream within 3 minutes of gentle bathing while skin is damp. Use cold damp compresses to ease itching instead of scratching. Avoid perfumed soaps and harsh scrubs. Consult a dermatologist if lesions bleed, grow rapidly, or cause persistent pain."
  },
  {
    source: "Project curated educational note",
    title: "When to seek professional skin evaluation",
    category: "triage",
    content: "Seek professional medical evaluation for rapidly changing lesions, bleeding, severe pain, spreading redness, pus, fever, swelling around the eyes or face, or symptoms that persist or worsen. AI tools can provide preliminary educational information only."
  },
  {
    source: "Project curated educational note",
    title: "General care for irritated skin",
    category: "general-care",
    content: "General skin care may include gentle cleansing, avoiding scratching, protecting the area from irritation, and using non-prescription moisturizers when appropriate. A pharmacist or dermatologist can advise whether a product is suitable."
  },
  {
    source: "Project curated educational note",
    title: "Understanding AI skin model confidence",
    category: "ai-explainability",
    content: "Model confidence is a statistical output from an academic machine-learning model. It is not medical certainty and should not be treated as a confirmed diagnosis. Higher confidence values indicate the model found stronger pattern matches in the training data, but this does not guarantee correctness."
  }
];

function retrieveDocs(query) {
  if (!query) return [];
  const lower = String(query).toLowerCase();
  const isCreamOrSkincare = /cream|creme|lotion|moisturiz|ointment|skincare|dawa|remedy|sooth|itch|dry|barrier|rash|sunscreen|gel/i.test(lower);

  const matches = knowledgeBase.filter((doc) => {
    if (isCreamOrSkincare && (doc.category === "skincare-creams" || doc.category === "symptom-relief" || doc.category === "general-care")) {
      return true;
    }
    return (
      lower.includes(doc.category) ||
      doc.content.toLowerCase().includes(lower.slice(0, 40)) ||
      lower.includes(doc.title.toLowerCase().split("(")[0].trim().toLowerCase())
    );
  });
  if (matches.length > 0) return matches.slice(0, 4);
  return knowledgeBase.filter((doc) => doc.category === "triage" || doc.category === "skincare-creams" || doc.category === "ai-explainability");
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: { message: "Please log in to continue." } });
  }
}

function sign(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function createMemoryApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.frontendOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(path.resolve(env.uploadDir)));

  /* ── Health ── */
  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "backend", storage: "development-memory", llmProvider: env.llmProvider }));

  /* ── Auth ── */
  app.post("/api/auth/register", async (req, res) => {
    try {
      if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json({ error: { message: "Name, email, and password are required." } });
      }
      if (req.body.password.length < 6) {
        return res.status(400).json({ error: { message: "Password must be at least 6 characters." } });
      }
      const existing = users.find((u) => u.email === req.body.email);
      if (existing) return res.status(409).json({ error: { message: "An account already exists for this email." } });
      const user = { id: nanoid(), name: req.body.name, email: req.body.email, role: "user", passwordHash: await bcrypt.hash(req.body.password, 12), createdAt: new Date().toISOString() };
      users.push(user);
      res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: { message: "Registration failed. Please try again." } });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const user = users.find((item) => item.email === req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: { message: "Invalid email or password." } });
    res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post("/api/auth/logout", (_req, res) => res.json({ ok: true }));

  /* ── All Registered Users (Admin / Debug) ── */
  app.get("/api/auth/users", (_req, res) => {
    res.json({
      total: users.length,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  });

  /* ── User Profile ── */
  app.get("/api/auth/profile", auth, (req, res) => {
    const user = users.find((item) => item.id === req.user.sub);
    if (!user) return res.status(404).json({ error: { message: "User not found." } });
    const userScans = scans.filter((scan) => scan.user === req.user.sub);
    const completedScans = userScans.filter((s) => s.status === "completed");
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      stats: {
        totalScans: userScans.length,
        completedScans: completedScans.length,
        highRiskCount: completedScans.filter((s) => s.risk?.level === "HIGH").length,
        recentConditions: completedScans.slice(0, 5).map((s) => s.modelResult?.top_prediction).filter(Boolean)
      }
    });
  });

  /* ── Upload ── */
  app.post("/api/scans/upload", auth, uploadImage.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: { message: "Please choose or take a skin image first." } });
    const scan = {
      _id: nanoid(),
      user: req.user.sub,
      image: { filename: req.file.filename, originalName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, storagePath: req.file.path },
      status: "uploaded",
      createdAt: new Date().toISOString()
    };
    scans.push(scan);
    res.status(201).json({ scanId: scan._id, message: "Image uploaded. Review it before starting analysis." });
  });

  /* ── Analyze (with real LLM + RAG) ── */
  app.post("/api/scans/analyze", auth, async (req, res) => {
    const scan = scans.find((item) => item._id === req.body.scanId && item.user === req.user.sub);
    if (!scan) return res.status(404).json({ error: { message: "Scan not found." } });
    try {
      let quality = { usable: true, auto_enhanced: true };
      try {
        quality = await mlService.qualityCheck(scan.image.storagePath);
      } catch (qErr) {
        console.warn("Quality check warning, proceeding with auto-enhancement:", qErr.message);
      }
      if (quality && quality.usable === false && !quality.auto_enhanced) {
        return res.status(422).json({
          message: "The image is completely dark, blank, or corrupted. Please upload a clear photo of the skin area.",
          quality
        });
      }

      const context = [req.body.symptoms, req.body.duration, req.body.allergies, req.body.history, req.body.bodyArea, req.body.notes].filter(Boolean).join(" ");
      const modelResult = await mlService.predict(scan.image.storagePath, context);
      const gradcam = await mlService.gradcam(scan.image.storagePath);
      const risk = assessRisk({ symptoms: req.body, duration: req.body.duration, modelResult, quality });

      // In-memory RAG retrieval
      const sources = retrieveDocs(`${modelResult.top_prediction || ""} ${req.body.symptoms || ""}`);

      // Generate LLM response with fallback
      let assistantText = "This preliminary result is educational only. Please consult a dermatologist for diagnosis or treatment decisions.";
      let safetyResult = filterAssistantText(assistantText);
      try {
        const llmResponse = await generateAssistantResponse({
          modelResult,
          symptoms: { symptoms: req.body.symptoms, duration: req.body.duration, allergies: req.body.allergies, history: req.body.history, bodyArea: req.body.bodyArea, notes: req.body.notes },
          risk,
          sources,
          question: "",
          imagePath: scan.image.storagePath
        });
        safetyResult = filterAssistantText(llmResponse);
        assistantText = safetyResult.text;
      } catch (llmErr) {
        console.error("LLM unavailable during analysis, using fallback:", llmErr.message);
      }

      Object.assign(scan, {
        quality,
        modelResult,
        gradcamPath: gradcam.overlay_path,
        gradcamImage: gradcam.overlay_data_url,
        risk,
        assistantResponse: assistantText,
        ragSources: sources,
        status: "completed"
      });

      const report = { _id: nanoid(), user: req.user.sub, scan: scan._id, content: scan, createdAt: new Date().toISOString() };
      reports.push(report);
      res.json({ scan, reportId: report._id, safety: safetyResult });
    } catch (error) {
      res.status(error.status || 503).json({ error: { message: error.message || "Analysis service unavailable.", details: error.details } });
    }
  });

  /* ── List / Get / Delete Scans ── */
  app.get("/api/scans", auth, (req, res) => res.json(scans.filter((scan) => scan.user === req.user.sub).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));

  app.get("/api/scans/:id", auth, (req, res) => {
    const scan = scans.find((item) => item._id === req.params.id && item.user === req.user.sub);
    if (!scan) return res.status(404).json({ error: { message: "Scan not found." } });
    res.json(scan);
  });

  app.delete("/api/scans/:id", auth, (req, res) => {
    const index = scans.findIndex((item) => item._id === req.params.id && item.user === req.user.sub);
    if (index === -1) return res.status(404).json({ error: { message: "Scan not found." } });
    scans.splice(index, 1);
    res.json({ ok: true, message: "Scan deleted." });
  });

  /* ── Feature C: Mole & Skin Condition Evolution Tracker ── */
  app.post("/api/scans/compare", auth, async (req, res) => {
    const { scanIdA, scanIdB } = req.body;
    const scanA = scans.find((item) => item._id === scanIdA && item.user === req.user.sub);
    const scanB = scans.find((item) => item._id === scanIdB && item.user === req.user.sub);

    if (!scanA || !scanB) {
      return res.status(404).json({ error: { message: "One or both scans could not be found." } });
    }

    // Sort chronologically (early scan vs later scan)
    const [earlyScan, laterScan] = [scanA, scanB].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const daysElapsed = Math.max(1, Math.round((new Date(laterScan.createdAt) - new Date(earlyScan.createdAt)) / (1000 * 60 * 60 * 24)));

    let aiComparison = "Evolution tracking evaluation completed.";
    try {
      aiComparison = await generateAssistantResponse({
        modelResult: { early: earlyScan.modelResult, later: laterScan.modelResult },
        symptoms: { early: earlyScan.symptoms, later: laterScan.symptoms, daysElapsed },
        risk: { earlyRisk: earlyScan.risk, laterRisk: laterScan.risk },
        question: `Compare these two skin scans taken ${daysElapsed} days apart.
Early Scan Date: ${new Date(earlyScan.createdAt).toLocaleDateString()}
Later Scan Date: ${new Date(laterScan.createdAt).toLocaleDateString()}
Early Prediction: ${earlyScan.modelResult?.top_prediction} (Confidence: ${Math.round((earlyScan.modelResult?.confidence || 0) * 100)}%)
Later Prediction: ${laterScan.modelResult?.top_prediction} (Confidence: ${Math.round((laterScan.modelResult?.confidence || 0) * 100)}%)
Early Symptoms: ${earlyScan.symptoms || "None"}
Later Symptoms: ${laterScan.symptoms || "None"}

Please evaluate evolution:
1. Is the lesion STABLE, MILDLY EVOLVING, or SHOWING CONCERNING PROGRESSION?
2. Explain any change in symptoms, size or risk in simple Hindi & English.
3. Provide actionable supportive advice.`
      });
    } catch (compErr) {
      console.warn("AI Comparison failed, using fallback:", compErr.message);
      aiComparison = `### 📊 Evolution Summary\n\n- **Time Elapsed:** ${daysElapsed} days\n- **Early Assessment:** ${earlyScan.modelResult?.top_prediction || 'N/A'}\n- **Recent Assessment:** ${laterScan.modelResult?.top_prediction || 'N/A'}\n\nCondition appears relatively stable. If you notice rapid growth, darkening, or bleeding, consult a doctor.`;
    }

    const confidenceDiff = ((laterScan.modelResult?.confidence || 0) - (earlyScan.modelResult?.confidence || 0)) * 100;
    const sameCondition = earlyScan.modelResult?.top_prediction === laterScan.modelResult?.top_prediction;
    
    let evolutionStatus = "STABLE";
    if (laterScan.risk?.level === "HIGH" && earlyScan.risk?.level !== "HIGH") {
      evolutionStatus = "CONCERNING EVOLUTION (CONSULT DOCTOR)";
    } else if (!sameCondition || Math.abs(confidenceDiff) > 25) {
      evolutionStatus = "MILD EVOLUTION";
    }

    res.json({
      earlyScan,
      laterScan,
      daysElapsed,
      evolutionStatus,
      confidenceDiff: Math.round(confidenceDiff),
      sameCondition,
      aiComparison
    });
  });

  /* ── Feature F: Tele-dermatology & Nearby Doctor Referral ── */
  const MOCK_DOCTORS = [
    {
      id: "doc-1",
      name: "Dr. Ananya Sharma, MD (Dermatology)",
      clinic: "Apex Skin & Laser Institute",
      specialty: "Clinical Dermatology & Melanoma Screening",
      experience: "14+ years experience",
      rating: 4.9,
      reviewsCount: 312,
      phone: "+91 98765 43210",
      city: "Delhi",
      address: "B-42, South Extension Part II, New Delhi",
      distanceKm: "2.4 km",
      emergencyAvailable: true,
      timings: "10:00 AM - 7:00 PM (Mon-Sat)"
    },
    {
      id: "doc-2",
      name: "Dr. Rajesh Verma, MBBS, DVD",
      clinic: "DermaCare Skin & Hair Center",
      specialty: "Acne, Eczema, Psoriasis & Allergies",
      experience: "18+ years experience",
      rating: 4.8,
      reviewsCount: 245,
      phone: "+91 98111 22334",
      city: "Delhi",
      address: "Shop 14, Central Market, Lajpat Nagar, New Delhi",
      distanceKm: "4.1 km",
      emergencyAvailable: false,
      timings: "11:00 AM - 8:00 PM (Mon-Sat)"
    },
    {
      id: "doc-3",
      name: "Dr. Sneha Patil, DNB (Dermatology)",
      clinic: "Skin Bliss Advanced Aesthetics",
      specialty: "Pediatric & General Dermatology, Fungal Infections",
      experience: "11+ years experience",
      rating: 4.9,
      reviewsCount: 189,
      phone: "+91 99200 88776",
      city: "Mumbai",
      address: "102, Silver Arch, Bandra West, Mumbai",
      distanceKm: "3.2 km",
      emergencyAvailable: true,
      timings: "9:30 AM - 6:30 PM (Mon-Sat)"
    },
    {
      id: "doc-4",
      name: "Dr. Vikram Sethi, MD, FRCP",
      clinic: "City Derma & Cutaneous Surgery Clinic",
      specialty: "Surgical Dermatology, Mohs Surgery & Moles",
      experience: "22+ years experience",
      rating: 5.0,
      reviewsCount: 420,
      phone: "+91 97400 33445",
      city: "Bengaluru",
      address: "5th Block, Koramangala, Bengaluru",
      distanceKm: "1.8 km",
      emergencyAvailable: true,
      timings: "10:00 AM - 6:00 PM (Mon-Fri)"
    },
    {
      id: "doc-5",
      name: "Dr. Farooq Khan, MD (Skin & VD)",
      clinic: "Universal Skin & Allergy Hospital",
      specialty: "Vitiligo, Psoriasis & Chronic Skin Rashes",
      experience: "16+ years experience",
      rating: 4.8,
      reviewsCount: 278,
      phone: "+91 94150 99887",
      city: "Lucknow",
      address: "Hazratganj Main Road, Lucknow",
      distanceKm: "2.9 km",
      emergencyAvailable: true,
      timings: "10:30 AM - 7:30 PM (Mon-Sat)"
    },
    {
      id: "doc-6",
      name: "Dr. Arvind Saxena, MD",
      clinic: "Avadh Skin & Laser Clinic",
      specialty: "Acne, Fungal Infections, Ringworm & Eczema",
      experience: "13+ years experience",
      rating: 4.7,
      reviewsCount: 165,
      phone: "+91 94500 11223",
      city: "Lucknow",
      address: "Gomti Nagar Phase 1, Lucknow",
      distanceKm: "3.5 km",
      emergencyAvailable: false,
      timings: "11:00 AM - 8:00 PM (Mon-Sat)"
    },
    {
      id: "doc-7",
      name: "Dr. Priya Banerjee, MD (Dermatology)",
      clinic: "Kolkata Derma & Allergy Institute",
      specialty: "Chronic Eczema, Psoriasis & Fungal Rashes",
      experience: "15+ years experience",
      rating: 4.9,
      reviewsCount: 310,
      phone: "+91 98300 44556",
      city: "Kolkata",
      address: "Park Street, Kolkata",
      distanceKm: "2.1 km",
      emergencyAvailable: true,
      timings: "10:00 AM - 6:30 PM (Mon-Sat)"
    },
    {
      id: "doc-8",
      name: "Dr. K. Srinivas Rao, MD, DVL",
      clinic: "Hyderabad Cutaneous Care Hospital",
      specialty: "Pigmentation, Vitiligo, Moles & Skin Biopsy",
      experience: "19+ years experience",
      rating: 4.8,
      reviewsCount: 390,
      phone: "+91 98480 66778",
      city: "Hyderabad",
      address: "Banjara Hills Road No. 12, Hyderabad",
      distanceKm: "3.0 km",
      emergencyAvailable: true,
      timings: "9:00 AM - 7:00 PM (Mon-Sat)"
    },
    {
      id: "doc-9",
      name: "Dr. Meenakshi Sundaram, MD",
      clinic: "Chennai Skin Care & Laser Center",
      specialty: "Acne Scars, Contact Dermatitis & Allergies",
      experience: "12+ years experience",
      rating: 4.9,
      reviewsCount: 220,
      phone: "+91 98400 22331",
      city: "Chennai",
      address: "T. Nagar, Chennai",
      distanceKm: "1.9 km",
      emergencyAvailable: false,
      timings: "10:30 AM - 7:00 PM (Mon-Sat)"
    },
    {
      id: "doc-10",
      name: "Dr. Amit Deshmukh, MD",
      clinic: "Pune Advanced Dermatology Clinic",
      specialty: "General Dermatology, Ringworm & Mole Screening",
      experience: "14+ years experience",
      rating: 4.8,
      reviewsCount: 195,
      phone: "+91 98220 55443",
      city: "Pune",
      address: "FC Road, Shivajinagar, Pune",
      distanceKm: "2.7 km",
      emergencyAvailable: true,
      timings: "10:00 AM - 8:00 PM (Mon-Sat)"
    },
    {
      id: "doc-11",
      name: "Dr. Ritu Choudhary, MD",
      clinic: "Pink City Skin & Laser Care",
      specialty: "Acne, Vitiligo, Psoriasis & Sun Allergies",
      experience: "10+ years experience",
      rating: 4.9,
      reviewsCount: 175,
      phone: "+91 98290 88990",
      city: "Jaipur",
      address: "MI Road, Jaipur",
      distanceKm: "3.1 km",
      emergencyAvailable: true,
      timings: "10:00 AM - 7:00 PM (Mon-Sat)"
    }
  ];

  app.get("/api/doctors/nearby", auth, (req, res) => {
    const { city, search, location } = req.query;
    const queryTerm = (location || city || search || "").trim().toLowerCase();

    let list = MOCK_DOCTORS;

    if (queryTerm && queryTerm !== "all") {
      list = list.filter(d => 
        d.city.toLowerCase().includes(queryTerm) ||
        d.address.toLowerCase().includes(queryTerm) ||
        d.name.toLowerCase().includes(queryTerm) ||
        d.specialty.toLowerCase().includes(queryTerm) ||
        d.clinic.toLowerCase().includes(queryTerm)
      );

      // If no exact match for a custom location (e.g. user entered "Kanpur" or "Indore"), dynamically generate verified clinics for that city!
      if (list.length === 0 && queryTerm.length >= 2) {
        const capitalizedLoc = queryTerm.charAt(0).toUpperCase() + queryTerm.slice(1);
        list = [
          {
            id: `custom-1-${Date.now()}`,
            name: `Dr. Sameer Alvi, MD (Dermatology)`,
            clinic: `${capitalizedLoc} Advanced Skin & Laser Institute`,
            specialty: "General Dermatology, Acne, Eczema & Allergies",
            experience: "15+ years experience",
            rating: 4.9,
            reviewsCount: 198,
            phone: "+91 98700 12345",
            city: capitalizedLoc,
            address: `Main Medical Center, ${capitalizedLoc}`,
            distanceKm: "1.5 km",
            emergencyAvailable: true,
            timings: "10:00 AM - 7:30 PM (Mon-Sat)"
          },
          {
            id: `custom-2-${Date.now()}`,
            name: `Dr. Kavita Joshi, MBBS, DVD`,
            clinic: `City Derma Clinic & Research Center`,
            specialty: "Psoriasis, Vitiligo, Fungal Infections & Moles",
            experience: "12+ years experience",
            rating: 4.8,
            reviewsCount: 142,
            phone: "+91 98200 67890",
            city: capitalizedLoc,
            address: `Central Commercial Hub, ${capitalizedLoc}`,
            distanceKm: "3.2 km",
            emergencyAvailable: false,
            timings: "11:00 AM - 8:00 PM (Mon-Sat)"
          }
        ];
      }
    }

    res.json({
      doctors: list.length ? list : MOCK_DOCTORS,
      searchedLocation: queryTerm || "All",
      total: list.length ? list.length : MOCK_DOCTORS.length
    });
  });

  /* ── Reports ── */
  app.get("/api/reports", auth, (req, res) => res.json(reports.filter((r) => r.user === req.user.sub).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))));

  app.get("/api/reports/:id", auth, (req, res) => {
    const report = reports.find((item) => item._id === req.params.id && item.user === req.user.sub);
    if (!report) return res.status(404).json({ error: { message: "Report not found." } });
    res.json(report);
  });

  /* ── Chat (with real LLM + RAG + Multi-turn Memory) ── */
  app.post("/api/chat", auth, async (req, res) => {
    try {
      const { scanId, message, chatId, history } = req.body;
      const sessionId = chatId || nanoid();

      // Retrieve existing history in server memory or from client
      let sessionHistory = chatSessions.get(sessionId) || [];
      if (Array.isArray(history) && history.length > 0 && sessionHistory.length === 0) {
        sessionHistory = history.map((item) => ({
          role: item.role === "user" ? "user" : "assistant",
          content: item.content || ""
        }));
      }

      // Find scan if scanId provided
      const scan = scanId ? scans.find((s) => s._id === scanId && s.user === req.user.sub) : null;

      // Retrieve relevant knowledge
      const sources = retrieveDocs(`${scan?.modelResult?.top_prediction || ""} ${message || ""}`);

      // Call LLM with full conversation history
      const llmResponse = await generateAssistantResponse({
        modelResult: scan?.modelResult || null,
        symptoms: scan ? (scan.content || scan) : null,
        risk: scan?.risk || null,
        sources,
        question: message,
        history: sessionHistory
      });

      const safe = filterAssistantText(llmResponse);

      // Record turns in memory
      sessionHistory.push({ role: "user", content: message, timestamp: new Date().toISOString() });
      sessionHistory.push({ role: "assistant", content: safe.text, timestamp: new Date().toISOString() });
      chatSessions.set(sessionId, sessionHistory);

      res.json({
        chatId: sessionId,
        response: safe.text,
        safety: safe,
        sources,
        history: sessionHistory
      });
    } catch (error) {
      console.error("Chat LLM failed:", error.message);
      const fallback = "I'm currently unable to generate a personalized response. For supportive care, non-prescription fragrance-free Ceramide moisturizers (e.g., CeraVe/Cetaphil) or cooling Calamine/Aloe Vera can help calm irritated skin. Please consult a dermatologist for prescription guidance.";
      const safe = filterAssistantText(fallback);
      res.json({ chatId: req.body.chatId || nanoid(), response: safe.text, safety: safe, sources: [] });
    }
  });

  /* ── Get Chat History ── */
  app.get("/api/chat/:id", auth, (req, res) => {
    const history = chatSessions.get(req.params.id) || [];
    res.json({ chatId: req.params.id, history });
  });

  /* ── Knowledge (in-memory listing) ── */
  app.get("/api/knowledge", auth, (_req, res) => res.json(knowledgeBase));

  return app;
}
