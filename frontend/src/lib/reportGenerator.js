import { getClassName } from "../context/AuthContext";

export function generateAndDownloadReport(scan, userName = "Patient") {
  if (!scan) return;

  const primaryCondition = getClassName(scan.modelResult?.top_prediction);
  const confidencePercent = Math.round((scan.modelResult?.confidence || 0) * 100);
  const riskLevel = scan.risk?.level || "LOW";
  const riskReasons = scan.risk?.reasons || [];
  const predictions = scan.modelResult?.predictions || [];
  const symptoms = scan.content?.symptoms || scan.symptoms || "None reported";
  const duration = scan.content?.duration || scan.duration || "Not specified";
  const bodyArea = scan.content?.bodyArea || scan.bodyArea || "Not specified";
  const dateStr = new Date(scan.createdAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DermAI Clinical Assessment Report - ${scan._id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 30px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 36px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
    }
    .meta-info {
      text-align: right;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .disclaimer-banner {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .metric-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-low { background: #d1fae5; color: #065f46; }
    .section {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
      background: #ffffff;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f766e;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .info-key {
      width: 140px;
      font-weight: 600;
      color: #475569;
      flex-shrink: 0;
    }
    .info-val {
      color: #0f172a;
    }
    .prob-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .prob-table th {
      background: #f1f5f9;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
    }
    .prob-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .prob-bar-bg {
      background: #e2e8f0;
      border-radius: 999px;
      height: 8px;
      width: 100px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-left: 8px;
    }
    .prob-bar-fill {
      background: #0d9488;
      height: 100%;
      border-radius: 999px;
    }
    .heatmap-img {
      max-height: 220px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      display: block;
      margin-top: 8px;
    }
    .guidance-box {
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
    }
    .source-item {
      background: #f8fafc;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    .actions-bar {
      margin-bottom: 20px;
      text-align: right;
    }
    .btn-print {
      background: #0d9488;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-print:hover { background: #0f766e; }
    @media print {
      body { background: #fff; padding: 0; }
      .report-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .actions-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="actions-bar">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="header">
      <div>
        <div class="brand-title">🩺 DermAI Assessment Report</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">AI-Powered Dermatological Health Evaluation</div>
      </div>
      <div class="meta-info">
        <div><strong>Patient Name:</strong> ${userName}</div>
        <div><strong>Report Ref:</strong> ${scan._id}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
      </div>
    </div>

    <div class="disclaimer-banner">
      ⚠️ <strong>Academic Prototype Notice:</strong> This clinical summary was generated by an AI research model trained on the HAM10000 dataset (EfficientNet-B0 + Gemini 2.5). It is intended solely for educational triage and preliminary assessment. It does <strong>not</strong> constitute an official medical diagnosis, prescription, or clinical treatment plan. Please share this document with a certified dermatologist for formal physical examination.
    </div>

    <div class="summary-grid">
      <div class="metric-box">
        <div class="metric-label">Primary Finding</div>
        <div class="metric-val" style="color: #0f766e;">${primaryCondition}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Dataset Code: <code>${scan.modelResult?.top_prediction || 'N/A'}</code></div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Model Confidence</div>
        <div class="metric-val">${confidencePercent}%</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Inference Latency: ${scan.modelResult?.inference_time_ms || '—'}ms</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Triage Risk Level</div>
        <div class="metric-val">
          <span class="badge ${riskLevel === 'HIGH' ? 'badge-high' : riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-low'}">
            ${riskLevel} RISK
          </span>
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${riskReasons.join(', ') || 'No acute red flags flagged'}</div>
      </div>
    </div>

    ${scan.quality?.auto_enhanced ? `
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #0f766e; margin-bottom: 20px;">
      ✨ <strong>Image Optimization Log:</strong> Original image lighting and edge sharpness were automatically enhanced via Adaptive CLAHE and Unsharp Masking prior to neural network inference.
    </div>` : ''}

    <div class="section">
      <div class="section-title">📋 Patient Reported Context</div>
      <div class="info-row"><span class="info-key">Reported Symptoms:</span><span class="info-val">${symptoms}</span></div>
      <div class="info-row"><span class="info-key">Duration:</span><span class="info-val">${duration}</span></div>
      <div class="info-row"><span class="info-key">Body Location:</span><span class="info-val">${bodyArea}</span></div>
    </div>

    ${scan.gradcamImage ? `
    <div class="section">
      <div class="section-title">🔍 Grad-CAM Neural Explainability (Visual Heatmap)</div>
      <img src="${scan.gradcamImage}" class="heatmap-img" alt="Grad-CAM Visualization" />
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">
        The heatmap overlay highlights convolutional feature activations that most strongly influenced the neural network's classification.
      </div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">📊 Multi-Class Probabilities (HAM10000 7-Class Distribution)</div>
      <table class="prob-table">
        <thead>
          <tr>
            <th>Condition Name</th>
            <th>Class Code</th>
            <th>Calculated Probability</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map(p => `
            <tr>
              <td><strong>${getClassName(p.condition)}</strong></td>
              <td><code>${p.condition}</code></td>
              <td>
                <span><strong>${(p.probability * 100).toFixed(2)}%</strong></span>
                <span class="prob-bar-bg"><span class="prob-bar-fill" style="width: ${Math.min(100, Math.round(p.probability * 100))}%;"></span></span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">🤖 AI Assistant Clinical & Skincare Guidance</div>
      <div class="guidance-box">${scan.assistantResponse || 'Guidance summary pending.'}</div>
    </div>

    ${(scan.ragSources && scan.ragSources.length > 0) ? `
    <div class="section">
      <div class="section-title">📚 Clinical Reference Sources (RAG)</div>
      ${scan.ragSources.map(s => `
        <div class="source-item">
          <div style="font-weight: 700; color: #334155;">${s.title}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Source: ${s.source}</div>
          ${s.content ? `<div style="color: #475569; margin-top: 4px; line-height: 1.4;">${s.content}</div>` : ''}
        </div>
      `).join('')}
    </div>` : ''}

    <div class="footer">
      <div>DermAI Prototype • Powered by HAM10000 & Gemini 2.5 Flash</div>
      <div>Attending Physician Signature: ___________________________</div>
    </div>
  </div>
</body>
</html>`;

  // Open printable window and trigger print dialog
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    // Fallback: download as .html file if popups are blocked
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DermAI_Report_${scan._id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
