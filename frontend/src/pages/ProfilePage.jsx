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
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex-1">
        {/* Profile Card */}
        <div className="rounded-2xl bg-gradient-brand p-6 text-white mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name || "User"}</h1>
              <p className="text-teal-100 text-sm">{user?.email || ""}</p>
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
              <div key={label} className="rounded-xl border bg-white p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Account Info */}
        <div className="rounded-xl border bg-white p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Name</p>
                <p className="text-sm font-medium text-slate-700">{user?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-700">{user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Role</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{user?.role || "user"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-xl border bg-white p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">🔬 Technology Stack</h3>
          <div className="grid grid-cols-2 gap-3">
            {techStack.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border bg-white p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">About DermAI</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            DermAI is an academic prototype for AI-powered skin health assessment. It uses a multimodal deep learning architecture combining a CNN (EfficientNet-B0) for image analysis with a Bidirectional GRU for contextual metadata processing, trained on the HAM10000 dataset containing 10,015 dermatoscopic images across 7 diagnostic categories.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mt-2">
            The system includes Grad-CAM visual explanations, a RAG-based knowledge retrieval system, Gemini AI-powered dermatologist assistant with safety filters, and a comprehensive risk assessment engine.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mt-3">
            ⚠️ This is not a medical device and should not be used for clinical diagnosis. Always consult a qualified healthcare professional for skin health concerns.
          </p>
        </div>

        <button onClick={logout} className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
          Sign Out
        </button>
      </div>
      <Footer />
    </div>
  );
}
