import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, Eye, Shield, Brain, Activity, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm({ ...form, [key]: val });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!form.name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Eye, title: "AI Skin Analysis", desc: "CNN + RNN multimodal deep learning" },
    { icon: Shield, title: "Safety Filters", desc: "No prescriptions, no fake diagnoses" },
    { icon: Brain, title: "AI Dermatologist", desc: "Powered by Gemini AI" },
    { icon: Activity, title: "Grad-CAM", desc: "Visual model explanations" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-brand flex-col justify-center px-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Stethoscope className="h-12 w-12" />
            <h1 className="text-4xl font-extrabold">DermAI</h1>
          </div>
          <p className="text-xl font-medium text-teal-100 mb-8">AI-Powered Skin Health Assessment Platform</p>
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white/10 backdrop-blur-sm p-4">
                <Icon className="h-6 w-6 mb-2 text-teal-200" />
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-teal-200 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs text-teal-300">Academic prototype • HAM10000 Dataset • Not for clinical use</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <Stethoscope className="h-8 w-8 text-teal-600" />
            <span className="text-2xl font-bold text-teal-700">DermAI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login" ? "Sign in to access your skin health assessments" : "Start your AI-powered skin health journey"}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm transition-colors" placeholder="Dr. Jane Smith" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm transition-colors" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm transition-colors" type="password" placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"} value={form.password} onChange={(e) => set("password", e.target.value)} required />
            </div>
            <button disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:bg-slate-400 transition-colors">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button className="font-semibold text-teal-600 hover:text-teal-700" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
