import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getClassName } from "../context/AuthContext";
import { RiskBadge, Footer } from "../components/Shared";
import { PlusCircle, Clock, Activity, AlertTriangle, TrendingUp, Scan } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/scans").then((r) => setScans(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const completed = scans.filter((s) => s.status === "completed");
  const highRisk = completed.filter((s) => s.risk?.level === "HIGH");
  const recentScans = scans.slice(0, 5);

  const stats = [
    { label: "Total Scans", value: scans.length, icon: Scan, color: "text-teal-600 bg-teal-50" },
    { label: "Completed", value: completed.length, icon: Activity, color: "text-blue-600 bg-blue-50" },
    { label: "High Risk", value: highRisk.length, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
    { label: "Success Rate", value: scans.length ? `${Math.round((completed.length / scans.length) * 100)}%` : "—", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 flex-1">
        {/* Welcome */}
        <div className="rounded-2xl bg-gradient-brand p-6 text-white mb-6 animate-fadeIn">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || "User"} 👋</h1>
          <p className="mt-1 text-teal-100 text-sm">Your AI-powered skin health assessment dashboard</p>
          <Link to="/scan" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2.5 text-sm font-semibold hover:bg-white/30 transition-colors">
            <PlusCircle className="h-4 w-4" /> Start New Assessment
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-slideUp shadow-xs">
              <div className={`inline-flex rounded-lg p-2 ${color} dark:bg-opacity-20`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? "—" : value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Link to="/scan" className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-200 dark:hover:border-teal-700 hover:shadow-md transition-all group">
            <div className="rounded-xl bg-teal-50 dark:bg-teal-900/40 p-3 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 transition-colors">
              <PlusCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">New Skin Assessment</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload a photo and get AI analysis</p>
            </div>
          </Link>
          <Link to="/history" className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-200 dark:hover:border-teal-700 hover:shadow-md transition-all group">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/40 p-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-colors">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">View History</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Review past assessments and reports</p>
            </div>
          </Link>
        </div>

        {/* Recent Scans */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Assessments</h2>
            {scans.length > 5 && <Link to="/history" className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 font-medium">View all →</Link>}
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg animate-shimmer dark:bg-slate-800" />)}</div>
          ) : recentScans.length === 0 ? (
            <div className="text-center py-8">
              <Scan className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No assessments yet. Start your first scan!</p>
              <Link to="/scan" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700">
                <PlusCircle className="h-4 w-4" /> New Assessment
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((s) => (
                <Link key={s._id} to={`/result/${s._id}`} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{getClassName(s.modelResult?.top_prediction) || s.status}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.modelResult?.confidence && <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{Math.round(s.modelResult.confidence * 100)}%</span>}
                    {s.risk && <RiskBadge level={s.risk.level} />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
