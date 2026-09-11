const RED_FLAGS = [
  { pattern: /rapid|quickly worsening|spreading fast/i, reason: "rapid worsening or spreading" },
  { pattern: /severe pain|very painful/i, reason: "severe pain" },
  { pattern: /bleed|bleeding|black|irregular mole/i, reason: "concerning bleeding or lesion change" },
  { pattern: /fever|pus|infected|hot swelling/i, reason: "possible infection-like symptoms" },
  { pattern: /face swelling|eye swelling|trouble breathing/i, reason: "significant swelling or systemic warning sign" }
];

export function assessRisk({ symptoms, duration, modelResult, quality }) {
  if (quality && quality.usable === false) {
    return { level: "MEDIUM", reasons: ["image quality is insufficient for reliable visual analysis"] };
  }
  const text = [symptoms?.symptoms, symptoms?.duration, symptoms?.history, symptoms?.notes].filter(Boolean).join(" ");
  const matches = RED_FLAGS.filter((rule) => rule.pattern.test(text)).map((rule) => rule.reason);
  if (matches.length) return { level: "HIGH", reasons: matches };
  if ((modelResult?.confidence || 0) < 0.55) {
    return { level: "MEDIUM", reasons: ["model confidence is below the experimental threshold"] };
  }
  if (/more than 4 weeks|month|months|year/i.test(duration || "")) {
    return { level: "MEDIUM", reasons: ["symptoms appear persistent"] };
  }
  return { level: "LOW", reasons: ["no configured red flags were detected"] };
}
