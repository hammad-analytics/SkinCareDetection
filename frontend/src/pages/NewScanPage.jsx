import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { LoadingSpinner, Footer } from "../components/Shared";
import { Camera, FileImage, Upload, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, Activity, Zap } from "lucide-react";
import CameraCaptureModal from "../components/CameraCaptureModal";

const STEPS = ["Upload Image", "Describe Symptoms (Optional)", "AI Analysis"];

export default function NewScanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [scanId, setScanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stage, setStage] = useState("");
  const [form, setForm] = useState({ symptoms: "", duration: "", allergies: "", history: "", bodyArea: "", notes: "" });

  const set = (key, val) => setForm({ ...form, [key]: val });

  const choose = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setScanId("");
    setError("");
  };

  const uploadImage = async () => {
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("image", file);
      setStage("Uploading image...");
      const { data } = await api.post("/scans/upload", body);
      setScanId(data.scanId);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  // 1-Click Instant Scan: Input ONLY image, skip symptoms completely!
  const quickAnalyze = async () => {
    setLoading(true);
    setError("");
    setStep(2);
    try {
      let id = scanId;
      if (!id) {
        setStage("Uploading image...");
        const body = new FormData();
        body.append("image", file);
        const { data: uploadData } = await api.post("/scans/upload", body);
        id = uploadData.scanId;
        setScanId(id);
      }
      setStage("Auto-enhancing image quality...");
      await new Promise(r => setTimeout(r, 400));
      setStage("Analyzing skin condition with Multimodal AI...");
      await new Promise(r => setTimeout(r, 400));
      setStage("Generating Grad-CAM neural heatmap...");
      const { data } = await api.post("/scans/analyze", {
        symptoms: form.symptoms || "Visual-only skin assessment (No symptoms specified)",
        duration: form.duration || "Not specified",
        scanId: id
      });
      setStage("Analysis complete! Redirecting...");
      await new Promise(r => setTimeout(r, 500));
      navigate(`/result/${data.scan._id}`, { state: { scan: data.scan } });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Analysis failed. Please try again.");
      setStep(0);
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const analyze = async () => {
    setLoading(true);
    setError("");
    setStep(2);
    try {
      let id = scanId;
      if (!id) {
        setStage("Uploading image...");
        const body = new FormData();
        body.append("image", file);
        const { data: uploadData } = await api.post("/scans/upload", body);
        id = uploadData.scanId;
        setScanId(id);
      }
      setStage("Analyzing image quality & contrast...");
      await new Promise(r => setTimeout(r, 400));
      setStage("Running Multimodal Vision & CNN prediction...");
      await new Promise(r => setTimeout(r, 400));
      setStage("Generating Grad-CAM explainability heatmap...");
      const { data } = await api.post("/scans/analyze", { ...form, scanId: id });
      setStage("Analysis complete! Redirecting...");
      await new Promise(r => setTimeout(r, 600));
      navigate(`/result/${data.scan._id}`, { state: { scan: data.scan } });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Analysis failed. Please try again.");
      setStep(1);
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const fields = [
    { key: "symptoms", label: "Describe Your Symptoms (Optional)", placeholder: "E.g., Red itchy patch on arm, pimples on forehead, or leave blank...", rows: 3 },
    { key: "duration", label: "How Long Have You Had This? (Optional)", placeholder: "E.g., 3 days, 2 weeks, or leave blank...", rows: 2 },
    { key: "bodyArea", label: "Body Area (Optional)", placeholder: "E.g., Face, left forearm, back, leg...", rows: 1 },
    { key: "allergies", label: "Known Allergies (Optional)", placeholder: "E.g., penicillin, soaps, none...", rows: 1 },
    { key: "history", label: "Medical History (Optional)", placeholder: "Previous skin conditions, family history...", rows: 2 },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 flex-1">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i <= step ? "bg-teal-600 text-white shadow-xs" : "bg-slate-200 text-slate-500"
                }`}>{i + 1}</div>
                <span className={`text-xs font-semibold hidden sm:inline ${i <= step ? "text-teal-700" : "text-slate-400"}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-8 sm:w-16 ${i < step ? "bg-teal-500" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 animate-fadeIn">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* Step 0: Upload Image */}
        {step === 0 && (
          <div className="animate-slideUp bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">Upload Skin Photo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Take a photo or choose from gallery. You can scan with <strong>Image Only</strong> without typing anything!</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button onClick={() => setCameraOpen(true)} className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/20 p-8 text-center hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all">
                <Camera className="mb-3 h-10 w-10 text-teal-600 dark:text-teal-400" />
                <span className="font-bold text-teal-800 dark:text-teal-300 text-sm">Take Photo</span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">Open camera &amp; capture live</span>
              </button>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-8 text-center hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all">
                <FileImage className="mb-3 h-10 w-10 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Choose File</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Upload from files or gallery</span>
                <input className="sr-only" type="file" accept="image/*,.heic,.heif" onChange={(e) => choose(e.target.files?.[0])} />
              </label>
            </div>

            {preview && (
              <div className="mt-6 animate-fadeIn border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900/5 dark:bg-slate-950 p-2">
                  <img alt="Selected skin area" src={preview} className="mx-auto max-h-72 rounded-lg object-contain" />
                </div>

                {/* Instant Scan Button & Options */}
                <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => { setFile(null); setPreview(""); }}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Change Photo
                  </button>

                  <button
                    onClick={quickAnalyze}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 px-5 text-xs font-extrabold text-white hover:bg-teal-700 shadow-md transition-all cursor-pointer"
                  >
                    <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {loading ? stage : "⚡ Instant Scan (Image Only - Analyze Now)"}
                  </button>

                  <button
                    onClick={uploadImage}
                    disabled={loading}
                    className="rounded-xl border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/40 py-3 px-4 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/60 transition-colors cursor-pointer"
                  >
                    Add Symptoms (Optional) →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Optional Symptoms */}
        {step === 1 && (
          <div className="animate-slideUp bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add Symptoms (Optional)</h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">Bina likhe bhi submit kar sakte hain</span>
            </div>

            {preview && (
              <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 p-2">
                <img alt="Uploaded image" src={preview} className="mx-auto max-h-36 rounded-lg object-contain" />
              </div>
            )}

            <div className="space-y-3.5">
              {fields.map(({ key, label, placeholder, rows }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                  <textarea
                    rows={rows}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3.5 py-2 text-xs focus:border-teal-600 dark:focus:border-teal-500 outline-hidden resize-none"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              <button
                onClick={analyze}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-xs font-bold text-white hover:bg-teal-700 shadow-md transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {loading ? stage : "Submit for AI Assessment"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Processing Animation */}
        {step === 2 && loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fadeIn bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-8 w-8 text-teal-600 animate-pulse-soft" />
              </div>
            </div>
            <h3 className="mt-6 text-lg font-bold text-slate-800">Analyzing Your Skin Image</h3>
            <p className="mt-1.5 text-xs text-slate-500 font-medium animate-pulse-soft">{stage || "Processing..."}</p>

            <div className="mt-6 w-full max-w-xs space-y-2">
              {["Image Quality & CLAHE Auto-Enhancement", "Multimodal Disease Classification", "Grad-CAM Heatmap Generation", "Clinical & OTC Skincare Guidance"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-xs text-slate-400">
                  <div className={`h-2 w-2 rounded-full ${i < 2 ? "bg-teal-500" : "bg-slate-300"} animate-pulse-soft`} />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(f) => { choose(f); setCameraOpen(false); }}
      />
    </div>
  );
}
