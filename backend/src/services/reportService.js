export function buildReport({ scan, symptoms, modelResult, quality, risk, assistantResponse }) {
  return {
    scanId: String(scan._id),
    generatedAt: new Date().toISOString(),
    title: "Preliminary AI-assisted skin health assessment",
    safetyDisclaimer:
      "This report provides preliminary skin-health information from an academic prototype. It is not a confirmed diagnosis and does not provide prescriptions.",
    imageReference: scan.image?.filename,
    modelVersion: modelResult?.model_version,
    predictedCondition: modelResult?.top_prediction || "Insufficient confidence",
    confidence: modelResult?.confidence,
    probabilities: modelResult?.predictions || [],
    imageQuality: quality,
    risk,
    userContext: symptoms,
    gradcamReference: scan.gradcamPath,
    gradcamImage: scan.gradcamImage,
    generalGuidance: assistantResponse
  };
}
