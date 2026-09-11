import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getClassName, useAuth } from "../context/AuthContext";
import { RiskBadge, LoadingSpinner, Footer } from "../components/Shared";
import { Clock, Trash2, Search, Filter, Scan, Download } from "lucide-react";
import { generateAndDownloadReport } from "../lib/reportGenerator";

export default function HistoryPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/scans").then((r) => setScans(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deleteScan = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this assessment?")) return;
    try {
      await api.delete(`/scans/${id}`);
      setScans(scans.filter((s) => s._id !== id));
    } catch {}
  };

  const filtered = scans.filter((s) => {
    if (filter === "completed" && s.status !== "completed") return false;
    if (filter === "high" && s.risk?.level !== "HIGH") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.modelResult?.top_prediction || "").toLowerCase().includes(q) ||
        getClassName(s.modelResult?.top_prediction).toLowerCase().includes(q) ||
        (s.status || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex-1">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Assessment History</h1>
        <p className="text-sm text-slate-500 mb-6">{scans.length} total assessment{scans.length !== 1 ? "s" : ""}</p>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm" placeholder="Search by condition..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" text="Loading history..." /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Scan className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-600">{search || filter !== "all" ? "No matching assessments" : "No assessments yet"}</h3>
            <p className="mt-1 text-sm text-slate-400">{search || filter !== "all" ? "Try adjusting your search or filter" : "Start your first skin health assessment"}</p>
            {!search && filter === "all" && (
              <Link to="/scan" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                Start Assessment
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Link key={s._id} to={`/result/${s._id}`} className="block rounded-xl border bg-white p-4 hover:border-teal-200 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{getClassName(s.modelResult?.top_prediction) || "Pending Analysis"}</h3>
                      {s.risk && <RiskBadge level={s.risk.level} />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(s.createdAt).toLocaleString()}</span>
                      {s.modelResult?.confidence && (
                        <span className="font-mono">Confidence: {Math.round(s.modelResult.confidence * 100)}%</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        s.status === "completed" ? "bg-emerald-100 text-emerald-700" : s.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>{s.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.status === "completed" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          generateAndDownloadReport(s, user?.name);
                        }}
                        className="rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-teal-50 hover:text-teal-600 transition-all cursor-pointer"
                        title="Download Medical Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={(e) => deleteScan(s._id, e)} className="rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
