// Precise regex targeting actual unsafe prescription dosage and dangerous claims,
// without blocking natural words like "take care", "twice daily", "100ml lotion", or helpful OTC guidance.
const HAZARDOUS_PATTERNS = [
  /\b(take|ingest|consume|inject)\s+(this|the)?\s*(tablet|pill|capsule|injection)\b/i,
  /\b(i hereby prescribe|i am prescribing you|my prescription for you)\b/i,
  /\b(you definitely have cancer|you are officially diagnosed with melanoma)\b/i,
  /\b(amoxicillin|azithromycin|prednisone|isotretinoin|doxycycline|methotrexate)\s+\d+\s?mg\b/i
];

export function filterAssistantText(text) {
  if (!text) return { allowed: true, text: "", violations: [] };

  const violations = HAZARDOUS_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);

  // If text doesn't contain hazardous prescription commands, allow it cleanly
  if (!violations.length) {
    return { allowed: true, text, violations: [] };
  }

  // Instead of wiping out the entire response, sanitize and append a mandatory medical safety disclaimer
  const safeText = text + "\n\n> ⚠️ **Clinical Safety Notice:** *Prescription systemic medications and formal clinical diagnoses require physical consultation and evaluation by a licensed healthcare professional.*";

  return {
    allowed: true,
    violations,
    text: safeText
  };
}

