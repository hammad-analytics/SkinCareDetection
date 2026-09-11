import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function LoadingSpinner({ size = "md", text }) {
  const dims = size === "lg" ? "h-10 w-10" : size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${dims} animate-spin rounded-full border-3 border-teal-200 border-t-teal-600`} />
      {text && <p className="text-sm text-slate-500 animate-pulse-soft">{text}</p>}
    </div>
  );
}

export function RiskBadge({ level }) {
  const colors = {
    HIGH: "bg-red-100 text-red-800 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-200"
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${colors[level] || colors.LOW}`}>
      <span className={`h-2 w-2 rounded-full ${level === "HIGH" ? "bg-red-500" : level === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500"}`} />
      {level || "UNKNOWN"} RISK
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-white/80 px-4 py-6 text-center text-xs text-slate-500 mt-auto">
      <p className="font-medium text-slate-600">⚠️ Academic Prototype — Not for Clinical Use</p>
      <p className="mt-1">This AI-assisted tool provides preliminary educational skin-health information only. It is not a confirmed diagnosis, prescription, or replacement for professional medical advice. Always consult a qualified dermatologist.</p>
      <p className="mt-2 text-slate-400">DermAI © 2024 — Powered by HAM10000 Dataset, EfficientNet-B0, Bidirectional GRU & Gemini AI</p>
    </footer>
  );
}
