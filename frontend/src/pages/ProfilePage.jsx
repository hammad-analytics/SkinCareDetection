import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Footer } from "../components/Shared";
import { User, Mail, Shield, Activity, Calendar, Brain, Eye, Cpu } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/auth/profile").then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  const techStack = [
    { icon: Brain, label: "CNN Model", value: "EfficientNet-B0" },
    { icon: Cpu, label: "RNN Model", value: "Bidirectional GRU" },
    { icon: Eye, label: "Explainability", value: "Grad-CAM" },
    { icon: Activity, label: "Dataset", value: "HAM10000 (7 classes)" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex-1">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-brand p-6 text-white mb-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-xs">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name || "User"}</h1>
              <p className="text-teal-100 text-sm">{user?.email || ""}</p>
              {user?.phone && <p className="text-teal-200 text-xs mt-0.5">📞 +91 {user.phone}</p>}
            </div>
          </div>
        </div>

        {/* Stats */}
        {profile?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Scans", value: profile.stats.totalScans },
              { label: "Completed", value: profile.stats.completedScans },
              { label: "High Risk", value: profile.stats.highRiskCount },
              { label: "Member Since", value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-center shadow-xs transition-colors">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Account Info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6 shadow-xs transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Name</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Role</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{user?.role || "user"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6 shadow-xs transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">🔬 Technology Stack</h3>
          <div className="grid grid-cols-2 gap-3">
            {techStack.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6 shadow-xs transition-colors">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">About DermAI</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            DermAI is an advanced AI-powered skin health assessment platform developed for B.Tech Major Project 2026–2027. It uses a multimodal deep learning architecture combining a CNN (EfficientNet-B0) for image analysis with a Bidirectional GRU for contextual metadata processing, trained on the <strong>HAM10000</strong> dataset and <strong>ISIC 2019</strong> archive across clinical skin condition categories.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
            The system features Grad-CAM visual heatmaps, a RAG-based clinical knowledge retrieval system, Gemini AI-powered bilingual dermatologist chat with clinical safety filters, time-series mole evolution tracking, and GPS tele-dermatologist doctor finder.
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 mt-3">
            ⚠️ This system provides educational preliminary assessments only. Always consult a certified dermatologist for clinical diagnosis and treatment.
          </p>
        </div>

        <button onClick={logout} className="w-full rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer">
          Sign Out
        </button>
      </div>
      <Footer />
    </div>
  );
}
