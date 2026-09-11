import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getClassName } from "../context/AuthContext";
import { getConditionDetails } from "../lib/diseaseDictionary";
import { LoadingSpinner, RiskBadge, Footer } from "../components/Shared";
import { Clock, ArrowRight, ShieldCheck, AlertTriangle, Activity, Calendar, GitCompare, FileText, CheckCircle2 } from "lucide-react";

export default function EvolutionTrackerPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanAId, setScanAId] = useState("");
  const [scanBId, setScanBId] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/scans")
      .then((res) => {
        const completed = res.data.filter((s) => s.status === "completed");
        setScans(completed);
        if (completed.length >= 2) {
          setScanAId(completed[1]._id);
          setScanBId(completed[0]._id);
        } else if (completed.length === 1) {
          setScanAId(completed[0]._id);
        }
      })
      .catch((err) => setError("Failed to load your past scans."))
      .finally(() => setLoading(false));
  }, []);

  const handleCompare = async () => {
    if (!scanAId || !scanBId) {
      setError("Please select two different scans to compare.");
      return;
    }
    if (scanAId === scanBId) {
      setError("Please pick two distinct assessments from different dates.");
      return;
    }

    setComparing(true);
    setError("");
    setComparisonResult(null);

    try {
      const { data } = await api.post("/scans/compare", { scanIdA: scanAId, scanIdB: scanBId });
      setComparisonResult(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Evolution comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  const scanA = scans.find((s) => s._id === scanAId);
  const scanB = scans.find((s) => s._id === scanBId);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
            <GitCompare className="h-4 w-4" /> Feature C: Time-Series Monitoring
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Mole & Skin Evolution Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">
            Compare past and recent photos of the same mole, rash or lesion to track changes in size, shape, color, or symptoms over time.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" text="Loading your past assessments..." />
          </div>
        ) : scans.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">At least 2 scans required for comparison</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              You currently have {scans.length} completed assessment. Take another photo of the affected skin area after a few days or weeks to track its progression!
            </p>
            <a
              href="/scan"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-all"
            >
              Start New Scan
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Selection Grid */}
            <div className="grid md:grid-cols-2 gap-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              {/* Scan A (Baseline / Older) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  📅 Step 1: Select Baseline (Earlier Scan)
                </label>
                <select
                  value={scanAId}
                  onChange={(e) => setScanAId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-hidden bg-white"
                >
                  {scans.map((s) => (
                    <option key={s._id} value={s._id}>
                      {new Date(s.createdAt).toLocaleDateString()} — {getClassName(s.modelResult?.top_prediction)}
                    </option>
                  ))}
                </select>

                {scanA && (
                  <div className="mt-4 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {scanA.gradcamImage || scanA.image ? (
                        <img
                          src={scanA.gradcamImage || `http://localhost:5000/uploads/${scanA.image?.filename}`}
                          alt="Scan A"
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-800">{getClassName(scanA.modelResult?.top_prediction)}</p>
                        <p className="text-slate-500">Date: {new Date(scanA.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-500">Confidence: {Math.round((scanA.modelResult?.confidence || 0) * 100)}%</p>
                        {scanA.risk && <RiskBadge level={scanA.risk.level} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan B (Recent) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  📅 Step 2: Select Recent / Follow-up Scan
                </label>
                <select
                  value={scanBId}
                  onChange={(e) => setScanBId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-hidden bg-white"
                >
                  {scans.map((s) => (
                    <option key={s._id} value={s._id}>
                      {new Date(s.createdAt).toLocaleDateString()} — {getClassName(s.modelResult?.top_prediction)}
                    </option>
                  ))}
                </select>

                {scanB && (
                  <div className="mt-4 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {scanB.gradcamImage || scanB.image ? (
                        <img
                          src={scanB.gradcamImage || `http://localhost:5000/uploads/${scanB.image?.filename}`}
                          alt="Scan B"
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-lg bg-slate-200 flex items-center justify-center text-xs text-slate-400">No Image</div>
                      )}
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-800">{getClassName(scanB.modelResult?.top_prediction)}</p>
                        <p className="text-slate-500">Date: {new Date(scanB.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-500">Confidence: {Math.round((scanB.modelResult?.confidence || 0) * 100)}%</p>
                        {scanB.risk && <RiskBadge level={scanB.risk.level} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compare Button */}
            <div className="text-center">
              <button
                onClick={handleCompare}
                disabled={comparing || scanAId === scanBId}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 disabled:bg-slate-300 transition-all cursor-pointer"
              >
                {comparing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <GitCompare className="h-4 w-4" />}
                {comparing ? "Analyzing Visual & Clinical Evolution..." : "Compare Scans & Analyze Evolution"}
              </button>
            </div>

            {/* Comparison Results Card */}
            {comparisonResult && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Evolution Tracking Analysis</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Time Elapsed: {comparisonResult.daysElapsed} days apart</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      comparisonResult.evolutionStatus.includes("CONCERNING")
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : comparisonResult.evolutionStatus.includes("MILD")
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {comparisonResult.evolutionStatus.includes("STABLE") && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {comparisonResult.evolutionStatus}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Visual Comparison */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4 text-center bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Baseline Scan ({new Date(comparisonResult.earlyScan.createdAt).toLocaleDateString()})</p>
                    <img
                      src={comparisonResult.earlyScan.gradcamImage || `http://localhost:5000/uploads/${comparisonResult.earlyScan.image?.filename}`}
                      alt="Early Scan"
                      className="mx-auto max-h-56 rounded-lg object-contain shadow-xs border border-slate-200"
                    />
                    <p className="mt-3 text-sm font-bold text-slate-800">{getClassName(comparisonResult.earlyScan.modelResult?.top_prediction)}</p>
                    <p className="text-xs text-slate-500">Confidence: {Math.round((comparisonResult.earlyScan.modelResult?.confidence || 0) * 100)}%</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-center bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Follow-up Scan ({new Date(comparisonResult.laterScan.createdAt).toLocaleDateString()})</p>
                    <img
                      src={comparisonResult.laterScan.gradcamImage || `http://localhost:5000/uploads/${comparisonResult.laterScan.image?.filename}`}
                      alt="Later Scan"
                      className="mx-auto max-h-56 rounded-lg object-contain shadow-xs border border-slate-200"
                    />
                    <p className="mt-3 text-sm font-bold text-slate-800">{getClassName(comparisonResult.laterScan.modelResult?.top_prediction)}</p>
                    <p className="text-xs text-slate-500">Confidence: {Math.round((comparisonResult.laterScan.modelResult?.confidence || 0) * 100)}%</p>
                  </div>
                </div>

                {/* AI Detailed Clinical Summary */}
                <div className="rounded-xl bg-teal-50/60 border border-teal-200 p-5">
                  <h3 className="text-sm font-bold text-teal-800 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> AI Dermatologist Evolution Assessment
                  </h3>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {comparisonResult.aiComparison}
                  </div>
                </div>

                {/* ABCDE Evolution Guide */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">🩺 ABCDE Evolution Checklist for Changing Moles:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700"><strong>A - Asymmetry:</strong> Ek hissa doosre se alag dikhta hai?</div>
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700"><strong>B - Border:</strong> Edges katingdaar ya irregular hain?</div>
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700"><strong>C - Color:</strong> Rang me kala, neela ya laal badlav aaya?</div>
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700"><strong>D - Diameter:</strong> Size 6mm (pencil eraser) se bada hai?</div>
                    <div className="p-2.5 rounded-lg bg-teal-100 text-teal-800 font-semibold"><strong>E - Evolving:</strong> Samay ke sath aakar ya roop badal raha hai?</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
