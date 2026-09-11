const UNSAFE_PATTERNS = [
  /\b\d+\s?(mg|ml|mcg|g)\b/i,
  /\btake\s+\w+.*\b(days|daily|twice|dose|dosage)\b/i,
  /\b(start|stop|change|increase|decrease)\b.*\b(medicine|medication|antibiotic|steroid|tablet|pill)\b/i,
  /\byou (have|definitely have|are diagnosed with)\b/i,
  /\b(amoxicillin|azithromycin|prednisone|isotretinoin|doxycycline)\b/i
];

export function filterAssistantText(text) {
  const violations = UNSAFE_PATTERNS.filter((pattern) => pattern.test(text || "")).map((pattern) => pattern.source);
  if (!violations.length) return { allowed: true, text, violations: [] };
  return {
    allowed: false,
    violations,
    text:
      "I cannot provide personalized diagnosis, prescription medication, or dosage instructions. I can explain the preliminary AI result and general skin-care categories, and a dermatologist or qualified clinician can advise what is appropriate for you."
  };
}
