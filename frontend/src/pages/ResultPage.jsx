import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { api } from "../lib/api";
import { getClassName, useAuth } from "../context/AuthContext";
import { getConditionDetails } from "../lib/diseaseDictionary";
import { LoadingSpinner, RiskBadge, Footer } from "../components/Shared";
import DoctorFinderModal from "../components/DoctorFinderModal";
import {
  Bot,
  Send,
  ArrowLeft,
  Download,
  Eye,
  AlertTriangle,
  FileText,
  Activity,
  MapPin,
  GitCompare,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { generateAndDownloadReport } from "../lib/reportGenerator";

/**
 * Clean, spacious formatter for AI Guidance on ResultPage
 */
function FormattedGuidance({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks = [];
  let currentSection = { title: "", items: [], text: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("###") || line.startsWith("##") || line.startsWith("#")) {
      if (currentSection.title || currentSection.items.length || currentSection.text.length) {
        blocks.push({ ...currentSection });
        currentSection = { title: "", items: [], text: [] };
      }
      currentSection.title = line.replace(/^[#\s]+/, "");
    } else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•") || line.startsWith("🔹")) {
      currentSection.items.push(line.replace(/^[-*•🔹]\s*/, ""));
    } else {
      currentSection.text.push(line);
    }
  }
  if (currentSection.title || currentSection.items.length || currentSection.text.length) {
    blocks.push(currentSection);
  }

  const formatBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-slate-800 text-sm leading-relaxed">
      {blocks.map((b, idx) => {
        const isWarning = b.title.toLowerCase().includes("doctor") || b.title.toLowerCase().includes("warning");
        const isCondition = b.title.toLowerCase().includes("naam") || b.title.toLowerCase().includes("condition");
        const isCream = b.title.toLowerCase().includes("cream") || b.title.toLowerCase().includes("dekhbhal");

        return (
          <div
            key={idx}
            className={`rounded-xl p-4 transition-all ${
              isWarning
                ? "bg-amber-50/80 border border-amber-200 text-amber-950"
                : isCondition
                ? "bg-teal-50/70 border border-teal-200"
                : isCream
                ? "bg-emerald-50/60 border border-emerald-200"
                : "bg-slate-50/70 border border-slate-200"
            }`}
          >
            {b.title && (
              <h4 className={`font-bold mb-2.5 flex items-center gap-2 text-sm ${
                isWarning ? "text-amber-800" : isCondition ? "text-teal-800" : isCream ? "text-emerald-800" : "text-slate-800"
              }`}>
                {isWarning && <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />}
                {isCream && <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />}
                {b.title}
              </h4>
            )}

            {b.text.length > 0 && (
              <div className="space-y-2 mb-2 text-slate-700">
                {b.text.map((t, tIdx) => (
                  <p key={tIdx} className="leading-relaxed">{formatBold(t)}</p>
                ))}
              </div>
            )}

            {b.items.length > 0 && (
              <ul className="space-y-2 mt-2">
                {b.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600 mt-2 shrink-0" />
                    <span className="text-slate-700 leading-relaxed">{formatBold(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [scan, setScan] = useState(location.state?.scan || null);
  const [loading, setLoading] = useState(!scan);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  useEffect(() => {
    if (!scan) {
      api.get(`/scans/${id}`).then((r) => setScan(r.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id, scan]);

  const askChat = async () => {
    if (!question.trim()) return;
    const userMsg = question;
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setQuestion("");
    setChatLoading(true);
    try {
      const { data } = await api.post("/chat", {
        scanId: scan._id,
        message: userMsg,
        chatId,
        history: chatMessages
      });
      setChatId(data.chatId);
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm unable to respond right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" text="Loading assessment..." /></div>;
  if (!scan) return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="h-12 w-12 text-amber-400 mb-3" />
      <p className="text-slate-600">Assessment not found</p>
      <Link to="/history" className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">← Back to History</Link>
    </div>
  );

  const conditionInfo = getConditionDetails(scan.modelResult?.top_prediction);
  const predictions = scan.modelResult?.predictions || [];
  const maxProb = Math.max(...predictions.map(p => p.probability), 0.01);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 flex-1">
        <Link to="/history" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to History
        </Link>

        {/* Top Header & Quick Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Assessment Result</h1>
            <p className="text-xs text-slate-400 mt-1">Ref: <span className="font-mono">{scan._id}</span> • {new Date(scan.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setDoctorModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-all shadow-2xs cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-teal-600" /> Find Doctor
            </button>
            <Link
              to="/tracker"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            >
              <GitCompare className="h-4 w-4 text-slate-500" /> Track Evolution
            </Link>
            <button
              onClick={() => generateAndDownloadReport(scan, user?.name)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" /> Download Report
            </button>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 mb-6 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span><strong>Preliminary AI Screening:</strong> This is an educational assessment, not an official clinical diagnosis or medical prescription. Always consult a certified dermatologist for physical examination and treatment plans.</span>
        </div>

        {scan.quality?.auto_enhanced && (
          <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs text-teal-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
            <div>
              <span className="font-bold">Image Auto-Optimized:</span> CLAHE contrast, edge sharpening, and lighting normalization were automatically applied to make this photo optimal for the AI model.
            </div>
          </div>
        )}

        {/* Bilingual Disease Highlight Card */}
        {conditionInfo && (
          <div className="rounded-2xl border border-teal-200 bg-white p-6 mb-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-700">Primary Condition Identified</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{conditionInfo.nameEn}</h2>
                <p className="text-sm font-semibold text-teal-700 mt-0.5">{conditionInfo.nameHi}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Category</span>
                <span className="inline-block rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 mt-0.5">
                  {conditionInfo.category}
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl">
              <p className="font-medium text-slate-800">{conditionInfo.simpleExplanation}</p>
              <p className="text-slate-600 mt-1">{conditionInfo.simpleExplanationHi}</p>
            </div>

            {conditionInfo.safeOtCare && (
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Safe OTC Creams & Home Supportive Care:
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {conditionInfo.safeOtCare.map((care, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{care}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border bg-white p-4 shadow-2xs">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Diagnosis Code</p>
            <p className="mt-1 text-base font-bold text-slate-800 font-mono">{scan.modelResult?.top_prediction || "Pending"}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-2xs">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Model Confidence</p>
            <p className="mt-1 text-xl font-black text-teal-600">{Math.round((scan.modelResult?.confidence || 0) * 100)}%</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-2xs">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Triage Risk Level</p>
            <div className="mt-1"><RiskBadge level={scan.risk?.level} /></div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-2xs">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Inference Time</p>
            <p className="mt-1 text-base font-bold text-slate-600">{scan.modelResult?.inference_time_ms || "—"}ms</p>
          </div>
        </div>

        {/* Risk Reasons */}
        {scan.risk?.reasons?.length > 0 && (
          <div className={`rounded-xl border p-4 mb-6 ${scan.risk.level === "HIGH" ? "bg-red-50 border-red-200" : scan.risk.level === "MEDIUM" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
            <h3 className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Triage Evaluation Factors:
            </h3>
            <ul className="mt-2 space-y-1">{scan.risk.reasons.map((r, i) => <li key={i} className="text-xs text-slate-700">• {r}</li>)}</ul>
          </div>
        )}

        {/* Probability Chart */}
        <div className="rounded-2xl border bg-white p-5 mb-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-4">
            <Activity className="h-4 w-4 text-teal-600" /> Multi-Class Statistical Distribution
          </h3>
          <div className="space-y-3">
            {predictions.map((item) => (
              <div key={item.condition}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{getClassName(item.condition)}</span>
                  <span className="font-mono text-slate-500">{(item.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.condition === scan.modelResult?.top_prediction ? "bg-teal-600" : "bg-slate-300"}`}
                    style={{ width: `${Math.min(100, (item.probability / maxProb) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grad-CAM Heatmap */}
        {scan.gradcamImage && (
          <div className="rounded-2xl border bg-white p-5 mb-6 shadow-xs">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
              <Eye className="h-4 w-4 text-teal-600" /> Explainable AI (Grad-CAM Neural Heatmap)
            </h3>
            <div className="text-center">
              <img alt="Grad-CAM heatmap overlay" src={scan.gradcamImage} className="mx-auto max-h-72 rounded-xl object-contain shadow-xs border border-slate-200" />
            </div>
            <p className="mt-3 text-xs text-slate-500 text-center">Highlighted heat zones indicate the exact lesion features that most heavily guided the neural network classification.</p>
          </div>
        )}

        {/* Spacious AI Clinical Guidance */}
        <div className="rounded-2xl border bg-white p-6 mb-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-3">
            <FileText className="h-5 w-5 text-teal-600" /> AI Dermatologist Comprehensive Guidance
          </h3>
          <FormattedGuidance content={scan.assistantResponse} />
        </div>

        {/* RAG Sources */}
        {(scan.ragSources || []).length > 0 && (
          <div className="rounded-2xl border bg-white p-5 mb-6 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">📚 Clinical Reference Sources (RAG)</h3>
            <div className="space-y-2">
              {scan.ragSources.map((s, i) => (
                <div key={i} className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
                  <p className="font-bold text-slate-800">{s.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.source}</p>
                  {s.content && <p className="text-slate-600 mt-1 line-clamp-2">{s.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive In-Context Chat */}
        <div className="rounded-2xl border bg-white p-6 shadow-xs">
          <h3 className="flex items-center gap-2 font-bold text-slate-800 text-base mb-4">
            <Bot className="h-5 w-5 text-teal-600" /> Ask Follow-up Questions About This Scan
          </h3>

          {chatMessages.length > 0 && (
            <div className="mb-4 max-h-96 overflow-y-auto space-y-4 rounded-xl bg-slate-50 p-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    m.role === "user" ? "bg-teal-600 text-white rounded-br-xs" : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 items-center text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                  Thinking with scan context...
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs focus:border-teal-600 outline-hidden"
              placeholder="Ask about safe creams, duration, remedies, or when to see a doctor..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askChat()}
            />
            <button
              onClick={askChat}
              disabled={!question.trim() || chatLoading}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-white hover:bg-teal-700 disabled:bg-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Doctor Finder Modal */}
      <DoctorFinderModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        currentScan={scan}
      />
    </div>
  );
}
