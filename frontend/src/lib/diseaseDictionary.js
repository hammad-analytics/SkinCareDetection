/**
 * DermAI Comprehensive Skin Condition Dictionary
 * Bilingual (Simple English + Hindi / Hinglish)
 * Covers Broad-Spectrum Skin Diseases + Pigmented Lesions
 */

export const SKIN_CONDITIONS = {
  // --- Broad-Spectrum Common Skin Diseases ---
  acne: {
    id: "acne",
    nameEn: "Acne & Pimples",
    nameHi: "कील-मुहासे (Pimples / Blackheads / Cystic Acne)",
    category: "Inflammatory / Sebaceous",
    simpleExplanation: "Skin pores get blocked with excess oil, dead skin cells, and bacteria, causing red bumps, pus pimples, or blackheads.",
    simpleExplanationHi: "त्वचा के रोमछिद्र (pores) तेल और मृत कोशिकाओं से बंद हो जाते हैं, जिससे लाल दाने, मवाद वाले मुहासे या कील निकल आते हैं।",
    commonCauses: ["Hormonal changes", "Excess skin oil (sebum)", "Bacterial buildup", "Stress", "Clogged pores"],
    safeOtCare: [
      "Salicylic Acid (2%) cleanser for clearing pores",
      "Benzoyl Peroxide (2.5% - 5%) gel for bacterial acne",
      "Niacinamide (5% - 10%) serum to reduce redness and sebum",
      "Oil-free, non-comedogenic gel moisturizer"
    ],
    doctorWarning: "If you have deep painful cysts, nodules, or scarring, consult a dermatologist for oral retinoids or prescription antibiotics."
  },
  eczema: {
    id: "eczema",
    nameEn: "Eczema (Atopic Dermatitis)",
    nameHi: "एक्जिमा / खुजली वाले लाल चकत्ते (Red Itchy Skin Rash)",
    category: "Allergic / Skin Barrier",
    simpleExplanation: "A skin barrier disorder that makes skin dry, intensely itchy, inflamed, and prone to flaking or cracking.",
    simpleExplanationHi: "स्किन का रक्षा कवच कमजोर होने से त्वचा बहुत ज्यादा सूखी, लाल, और खुजलीदार हो जाती है।",
    commonCauses: ["Skin barrier breakdown", "Allergens (soaps, detergents)", "Weather changes", "Genetic sensitivity"],
    safeOtCare: [
      "Ceramide-rich barrier repair moisturizers (CeraVe, Cetaphil)",
      "Colloidal Oatmeal soothing creams or baths",
      "Fragrance-free Petroleum Jelly (Vaseline) on damp skin",
      "Cold damp compresses to calm intense itching"
    ],
    doctorWarning: "If skin oozes yellowish fluid, cracks severely, or interferes with sleep, see a doctor for medical anti-inflammatory creams."
  },
  psoriasis: {
    id: "psoriasis",
    nameEn: "Psoriasis",
    nameHi: "सोरायसिस / चांदी जैसी सफेद पपड़ी (Silvery Scaly Plaques)",
    category: "Autoimmune / Proliferative",
    simpleExplanation: "Skin cells multiply too quickly, forming thick, raised red patches covered with silvery-white flakes and scales.",
    simpleExplanationHi: "त्वचा की कोशिकाएं बहुत तेजी से बनती हैं, जिससे लाल उभरे हुए चकत्ते और चांदी जैसी सफेद पपड़ियां जम जाती हैं।",
    commonCauses: ["Immune system overactivity", "Stress or illness", "Skin trauma / Koebner phenomenon", "Cold, dry weather"],
    safeOtCare: [
      "Coal Tar (1% - 2%) ointment or shampoos for plaque reduction",
      "Salicylic Acid creams to gently soften and lift scales",
      "Heavy emollient ointments to prevent skin cracking",
      "Mild sun exposure (10-15 mins morning sunlight)"
    ],
    doctorWarning: "Psoriasis requires ongoing dermatologist management for prescription topical agents, UV phototherapy, or systemic treatments."
  },
  tinea: {
    id: "tinea",
    nameEn: "Fungal Infection / Ringworm (Tinea)",
    nameHi: "दाद / फंगल इन्फेक्शन (Ringworm / Daad / Khaj)",
    category: "Fungal Infection",
    simpleExplanation: "A contagious fungal infection creating circular, ring-shaped red rashes with raised, scaly, very itchy borders.",
    simpleExplanationHi: "फंगस से होने वाला इन्फेक्शन जिसमें गोल छल्ले (ring) जैसे लाल, खुरदुरे और तेज खुजली वाले चकत्ते बन जाते हैं।",
    commonCauses: ["Fungal dermatophytes", "Sweat and moisture", "Sharing towels/clothes", "Warm, humid weather"],
    safeOtCare: [
      "Clotrimazole (1%) or Miconazole (2%) antifungal cream applied 2x daily",
      "Ketoconazole soap or wash for affected body areas",
      "Keep area strictly clean, cool, and 100% dry after bathing",
      "Wear loose, breathable pure cotton clothing"
    ],
    doctorWarning: "Do NOT use steroid creams (Betnovate/Clobetasol) on fungal infections — steroids make fungus spread aggressively. If no improvement in 2 weeks, see a doctor."
  },
  vitiligo: {
    id: "vitiligo",
    nameEn: "Vitiligo",
    nameHi: "सफेद दाग (Safed Daag / Loss of Skin Color)",
    category: "Pigmentary / Autoimmune",
    simpleExplanation: "The body's pigment-producing cells (melanocytes) stop functioning, leading to smooth, painless white patches on the skin.",
    simpleExplanationHi: "त्वचा को रंग देने वाली कोशिकाएं काम करना बंद कर देती हैं, जिससे स्किन पर सफेद पैच (धब्बे) बन जाते हैं। यह कोई छूत की बीमारी नहीं है।",
    commonCauses: ["Autoimmune destruction of melanocytes", "Genetic predisposition", "Emotional or physical stress"],
    safeOtCare: [
      "Broad-Spectrum SPF 50+ Sunscreen (white areas burn very easily in sun)",
      "Gentle fragrance-free daily barrier hydration",
      "Cosmetic camouflage creams for skin tone blending if desired"
    ],
    doctorWarning: "Consult a dermatologist early; treatments like topical calcineurin inhibitors, excimer laser, or narrowband UVB work best in early stages."
  },
  rosacea: {
    id: "rosacea",
    nameEn: "Rosacea",
    nameHi: "रोजेशिया / चेहरे की लाली और लाल नसें (Facial Redness)",
    category: "Vascular / Facial",
    simpleExplanation: "A chronic condition causing persistent blushing, redness, and visible tiny blood vessels primarily on the cheeks and nose.",
    simpleExplanationHi: "चेहरे के बीच (गाल और नाक) पर लगातार लाली रहना, हल्की जलन और बारीक लाल नसें दिखाई देना।",
    commonCauses: ["Sensitive blood vessels", "Spicy food, caffeine, or alcohol triggers", "Sun exposure and heat", "Demodex skin mites"],
    safeOtCare: [
      "Azelaic Acid (10%) cream or suspension for redness soothing",
      "Gentle mineral Zinc Oxide sunscreen (SPF 50) daily",
      "Ultra-mild non-foaming hydrating facial cleanser",
      "Avoid triggers like hot spicy food, alcohol, and harsh scrubs"
    ],
    doctorWarning: "If your eyes feel gritty or red (ocular rosacea) or if pimple-like bumps persist, seek dermatologist prescription care."
  },
  urticaria: {
    id: "urticaria",
    nameEn: "Hives (Urticaria)",
    nameHi: "पित्ती उछलना / एलर्जी वाले लाल चकत्ते (Allergic Wheals)",
    category: "Allergic / Immediate",
    simpleExplanation: "Raised, intensely itchy pink or red welts that appear suddenly, often due to an allergic reaction, and change location rapidly.",
    simpleExplanationHi: "अचानक उभरने वाले लाल या गुलाबी उभरे हुए चकत्ते जिनमें बहुत तेज खुजली होती है। यह अक्सर एलर्जी के कारण होता है।",
    commonCauses: ["Allergic reaction to food, medicines, or bites", "Viral infection", "Heat, sweat, or friction"],
    safeOtCare: [
      "Cool damp compress or ice pack wrapped in cloth on itchy areas",
      "Calamine lotion for soothing the itch and burning sensation",
      "Over-the-counter Cetirizine or Loratadine (non-drowsy antihistamine)",
      "Wear loose clothing to prevent skin friction"
    ],
    doctorWarning: "EMERGENCY: If hives occur with swelling of lips/tongue, difficulty breathing, or dizziness (anaphylaxis), seek hospital emergency care immediately."
  },

  // --- HAM10000 Pigmented Lesions & Moles ---
  nv: {
    id: "nv",
    nameEn: "Normal Mole (Melanocytic Nevus)",
    nameHi: "सामान्य तिल / कुदरती मस्सा (Normal Harmless Mole)",
    category: "Benign Pigmented Mole",
    simpleExplanation: "A harmless, common cluster of pigment-producing skin cells. Most adults have 10 to 40 benign moles.",
    simpleExplanationHi: "यह एक सामान्य और हानिरहित तिल है। यह कोई कैंसर नहीं है और आमतौर पर कोई खतरा नहीं होता।",
    commonCauses: ["Normal genetic mole development", "Sun exposure during childhood"],
    safeOtCare: [
      "No medical treatment required for harmless moles",
      "Apply broad-spectrum sunscreen to prevent sun-induced changes",
      "Monitor with ABCDE rules (Asymmetry, Border, Color, Diameter, Evolution)"
    ],
    doctorWarning: "If this mole starts bleeding, grows rapidly, turns pitch black, or becomes asymmetrical, have it examined by a doctor."
  },
  mel: {
    id: "mel",
    nameEn: "Melanoma (Skin Cancer Alert)",
    nameHi: "मेलेनोमा (गंभीर तिल / संभावित स्किन कैंसर)",
    category: "Malignant Skin Cancer",
    simpleExplanation: "A serious type of skin cancer originating in melanocytes. Highly treatable when caught early, dangerous if neglected.",
    simpleExplanationHi: "यह एक गंभीर प्रकार का स्किन कैंसर हो सकता है जो तिल से शुरू होता है। समय रहते डॉक्टर को दिखाना बहुत जरूरी है।",
    commonCauses: ["Ultraviolet (UV) radiation from sun or tanning beds", "Genetic family history", "Multiple atypical moles"],
    safeOtCare: [
      "Do NOT apply home remedies, acids, or herbal pastes",
      "Keep area clean, dry, and unmanipulated",
      "Protect from further sunlight with clothing or bandage"
    ],
    doctorWarning: "URGENT: Schedule an immediate in-person consultation with a surgical oncologist or dermatologist for dermoscopy and biopsy."
  },
  bcc: {
    id: "bcc",
    nameEn: "Basal Cell Carcinoma",
    nameHi: "बेसल सेल स्किन ट्यूमर (Basal Cell Skin Growth)",
    category: "Non-Melanoma Skin Cancer",
    simpleExplanation: "The most common form of skin cancer, appearing as a pearly, waxy bump or non-healing red sore, almost never spreads to distant organs.",
    simpleExplanationHi: "स्किन कैंसर का सबसे आम प्रकार जो बहुत धीरे बढ़ता है और शरीर में फैलता नहीं है, पर त्वचा पर घाव जैसा दिखता है।",
    commonCauses: ["Cumulative long-term sun exposure", "Fair skin complexion"],
    safeOtCare: ["Do not scratch or squeeze", "Keep protected from UV radiation"],
    doctorWarning: "Consult a dermatologist for minor outpatient removal (excision or Mohs surgery) before it grows larger."
  },
  akiec: {
    id: "akiec",
    nameEn: "Actinic Keratosis (Sun Damage)",
    nameHi: "धूप से खुरदुरी त्वचा / प्री-कैंसर धब्बा (Pre-Cancerous Scaly Spot)",
    category: "Pre-Cancerous Lesion",
    simpleExplanation: "A rough, scaly patch caused by years of sun exposure. Classified as pre-cancerous because a small percentage can evolve if left untreated.",
    simpleExplanationHi: "सालों की धूप से त्वचा पर बनी खुरदरी, सूखी पपड़ी। इसका इलाज आसान है ताकि यह आगे न बढ़े।",
    commonCauses: ["Chronic UV sun damage", "Older age", "Fair skin"],
    safeOtCare: ["Rich emollient moisturizing creams", "Strict daily SPF 50+ mineral sunscreen application"],
    doctorWarning: "Dermatologists can easily treat this with liquid nitrogen cryotherapy or prescription creams."
  },
  bkl: {
    id: "bkl",
    nameEn: "Benign Keratosis (Age / Sun Spot)",
    nameHi: "उम्र या धूप का धब्बा / मस्सा (Harmless Age Spot / Seborrheic Keratosis)",
    category: "Benign Skin Growth",
    simpleExplanation: "Completely harmless, non-cancerous wart-like growth or flat brown age spot that appears as people get older.",
    simpleExplanationHi: "उम्र बढ़ने या धूप से होने वाला बिल्कुल सुरक्षित धब्बा या मस्सा। यह कोई बीमारी या कैंसर नहीं है।",
    commonCauses: ["Normal aging process", "Genetic predisposition"],
    safeOtCare: ["Gentle moisturizing lotions", "No treatment needed unless irritated by clothing"],
    doctorWarning: "Completely harmless. Can be removed cosmetically by a dermatologist if it rubs against clothing."
  },
  df: {
    id: "df",
    nameEn: "Dermatofibroma",
    nameHi: "स्किन की हानिरहित गांठ (Harmless Firm Skin Bump)",
    category: "Benign Fibrous Nodule",
    simpleExplanation: "A harmless, firm, brownish-pink small bump under the skin, often forming after a minor bug bite or prick.",
    simpleExplanationHi: "त्वचा के नीचे एक छोटी सख्त गांठ जो कीड़े के काटने या हल्की चोट के बाद बन जाती है। यह पूरी तरह सुरक्षित है।",
    commonCauses: ["Reaction to insect bites or minor skin punctures"],
    safeOtCare: ["Leave alone; no treatment required"],
    doctorWarning: "Harmless. If painful or changing color, consult a physician."
  },
  vasc: {
    id: "vasc",
    nameEn: "Vascular Lesion (Cherry Angioma)",
    nameHi: "खून की नसों का लाल दाना (Harmless Red Blood Vessel Spot)",
    category: "Benign Vascular",
    simpleExplanation: "A bright red, benign collection of small blood vessels (cherry angioma). Common and safe.",
    simpleExplanationHi: "खून की नन्हीं नसों का लाल दाना या निशान। यह पूरी तरह सुरक्षित और सामान्य होता है।",
    commonCauses: ["Aging", "Genetic tendency", "Pregnancy hormones"],
    safeOtCare: ["Avoid scratching or picking to prevent minor bleeding"],
    doctorWarning: "Harmless. If bleeding recurrently, a dermatologist can easily remove it with laser or electrocautery."
  }
};

/**
 * Returns user-friendly bilingual display object for any condition code or text
 */
export function getConditionDetails(conditionKey) {
  if (!conditionKey) return null;
  const key = String(conditionKey).toLowerCase().trim();
  
  // Direct match
  if (SKIN_CONDITIONS[key]) return SKIN_CONDITIONS[key];

  // Partial match checks
  if (key.includes("acne") || key.includes("pimple") || key.includes("muhase")) return SKIN_CONDITIONS.acne;
  if (key.includes("eczema") || key.includes("dermatitis") || key.includes("atopic")) return SKIN_CONDITIONS.eczema;
  if (key.includes("psoriasis") || key.includes("chambal")) return SKIN_CONDITIONS.psoriasis;
  if (key.includes("tinea") || key.includes("fungal") || key.includes("ringworm") || key.includes("daad")) return SKIN_CONDITIONS.tinea;
  if (key.includes("vitiligo") || key.includes("safed")) return SKIN_CONDITIONS.vitiligo;
  if (key.includes("rosacea") || key.includes("redness")) return SKIN_CONDITIONS.rosacea;
  if (key.includes("urticaria") || key.includes("hives") || key.includes("pitti")) return SKIN_CONDITIONS.urticaria;
  if (key.includes("melanoma") || key === "mel") return SKIN_CONDITIONS.mel;
  if (key.includes("nevus") || key.includes("mole") || key === "nv" || key.includes("til")) return SKIN_CONDITIONS.nv;
  if (key.includes("keratosis") || key === "bkl") return SKIN_CONDITIONS.bkl;
  if (key.includes("carcinoma") || key === "bcc") return SKIN_CONDITIONS.bcc;
  if (key === "akiec") return SKIN_CONDITIONS.akiec;
  if (key === "df") return SKIN_CONDITIONS.df;
  if (key === "vasc") return SKIN_CONDITIONS.vasc;

  // Fallback generic object
  return {
    id: key,
    nameEn: key.toUpperCase(),
    nameHi: `${key} (त्वचा की स्थिति)`,
    category: "Dermatological Assessment",
    simpleExplanation: "A skin condition requiring preliminary dermatological evaluation.",
    simpleExplanationHi: "त्वचा की स्थिति जिसकी डॉक्टरी जांच की सलाह दी जाती है।",
    safeOtCare: ["Keep skin clean, dry, and protected with gentle moisturizer"],
    doctorWarning: "Consult a certified doctor for personalized diagnosis."
  };
}
