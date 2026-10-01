import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  ShieldCheck,
  Users,
  Scan,
  MessageSquare,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, scans, chats
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [chats, setChats] = useState([]);

  // Search & filter states
  const [userSearch, setUserSearch] = useState("");
  const [scanFilter, setScanFilter] = useState({ condition: "", risk: "" });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      setError("Failed to load statistics. Ensure backend is running.");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, []);

  const fetchScans = useCallback(async () => {
    try {
      const params = {};
      if (scanFilter.condition) params.condition = scanFilter.condition;
      if (scanFilter.risk) params.risk = scanFilter.risk;
      const res = await api.get("/admin/scans", { params });
      setScans(res.data.scans || []);
    } catch (err) {
      console.error("Failed to load scans:", err);
    }
  }, [scanFilter]);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/admin/chats");
      setChats(res.data.chats || []);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setRefreshing(true);
    setError("");
    await Promise.all([fetchStats(), fetchUsers(), fetchScans(), fetchChats()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchStats, fetchUsers, fetchScans, fetchChats]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Role toggle
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Are you sure you want to change ${targetUser.name || targetUser.email}'s role to "${newRole.toUpperCase()}"?`)) {
      return;
    }
    try {
      await api.patch(`/admin/users/${targetUser._id}/role`, { role: newRole });
      setSuccessMsg(`Role updated to ${newRole.toUpperCase()} successfully!`);
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to update role");
    }
  };

  // Delete user
  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`CRITICAL ACTION: Delete user "${targetUser.name || targetUser.email}" and all associated diagnostic scans permanently?`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${targetUser._id}`);
      setSuccessMsg(`User deleted successfully.`);
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to delete user");
    }
  };

  // Delete scan
  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;
    try {
      await api.delete(`/admin/scans/${scanId}`);
      setSuccessMsg("Scan deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchScans();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to delete scan");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Clinical Admin Control Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Control Center</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                    Administrator
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Platform telemetry, patient diagnostic audits & user management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
              {refreshing ? "Syncing..." : "Refresh Data"}
            </button>
            <Link
              to="/"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all"
            >
              Back to Patient App
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-700 text-teal-800 dark:text-teal-300 text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 text-sm font-medium flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Overview & Telemetry", icon: Activity },
            { id: "users", label: `User Directory (${users.length})`, icon: Users },
            { id: "scans", label: `Diagnostic Scans (${scans.length})`, icon: Scan },
            { id: "chats", label: `Doctor Consultations (${chats.length})`, icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? "border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-800/80 shadow-2xs font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Users</span>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.metrics?.totalUsers || 0}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Saved in local MongoDB</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Skin Scans</span>
                  <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Scan className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.metrics?.totalScans || 0}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ISIC & HAM10000 pipeline</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Doctor Chats</span>
                  <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.metrics?.totalChats || 0}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Groq LLM conversations</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Care Reports</span>
                  <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.metrics?.totalReports || 0}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clinical assessments</p>
              </div>
            </div>

            {/* System Infrastructure Status */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Server className="h-4 w-4 text-teal-600" /> System Architecture & Service Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-teal-600" /> Database Server
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">127.0.0.1:27017</p>
                  <p className="text-[11px] text-slate-400 mt-1">Database: skincare_detection</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-indigo-600" /> ML Vision Microservice
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      stats?.systemHealth?.mlService === "online"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {stats?.systemHealth?.mlService === "online" ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">FastAPI port 8000</p>
                  <p className="text-[11px] text-slate-400 mt-1">HAM10000 + ISIC Multimodal CNN</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-purple-600" /> LLM Reasoning Engine
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">GROQ Free Tier</p>
                  <p className="text-[11px] text-slate-400 mt-1">Model: qwen/qwen3.8-27b</p>
                </div>
              </div>
            </div>

            {/* Disease & Risk Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                  Clinical Risk Stratification
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low Risk (Routine Care)
                    </span>
                    <span className="font-bold">{stats?.riskBreakdown?.low || 0} scans</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate Risk (Monitor)
                    </span>
                    <span className="font-bold">{stats?.riskBreakdown?.medium || 0} scans</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> High Risk (Urgent Dermatologist)
                    </span>
                    <span className="font-bold">{stats?.riskBreakdown?.high || 0} scans</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                  Recent Platform Users
                </h3>
                <div className="space-y-2.5">
                  {(stats?.recentUsers || []).map((u) => (
                    <div key={u._id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{u.name || "Anonymous User"}</p>
                        <p className="text-slate-400">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Search bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name, email or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">Scans</th>
                      <th className="py-3 px-4 text-center">Chats</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = String(u._id) === String(user?.id);
                        return (
                          <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                {u.name || "Anonymous User"}
                                {isSelf && (
                                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 font-mono text-[11px]">{u._id}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{u.email}</p>
                              <p className="text-slate-400 text-xs">{u.phone ? `+91 ${u.phone}` : "No phone"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-teal-600 dark:text-teal-400">
                              {u.scanCount || 0}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                              {u.chatCount || 0}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={isSelf}
                                  title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                  {u.role === "admin" ? <UserX className="h-4 w-4 text-amber-600" /> : <UserCheck className="h-4 w-4 text-teal-600" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={isSelf}
                                  title="Delete User"
                                  className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DIAGNOSTIC SCANS AUDIT */}
        {activeTab === "scans" && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Clinical Audit Trail • {scans.length} diagnostic submissions
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={scanFilter.risk}
                  onChange={(e) => setScanFilter({ ...scanFilter, risk: e.target.value })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Detected Condition</th>
                      <th className="py-3 px-4 text-center">Confidence</th>
                      <th className="py-3 px-4">Risk Tier</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No skin scans recorded yet. Upload a scan from the "New Scan" tab to see real data.
                        </td>
                      </tr>
                    ) : (
                      scans.map((s) => {
                        const condition = s.modelResult?.condition || s.modelResult?.predictedClass || "Analyzed Lesion";
                        const conf = s.modelResult?.confidence ? Math.round(s.modelResult.confidence * 100) : null;
                        const riskLevel = s.risk?.level?.toLowerCase() || "low";
                        return (
                          <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{s.user?.name || "Patient"}</p>
                              <p className="text-slate-400 text-xs">{s.user?.email || "N/A"}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-teal-700 dark:text-teal-400">{condition}</p>
                              <p className="text-slate-400 text-[11px] font-mono">{s._id}</p>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {conf !== null ? `${conf}%` : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                riskLevel === "high"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : riskLevel === "medium"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              }`}>
                                {riskLevel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {new Date(s.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/result/${s._id}`}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-teal-600"
                                  title="View Report"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteScan(s._id)}
                                  className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                                  title="Delete Scan"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AI CONSULTATION LOGS */}
        {activeTab === "chats" && (
          <div className="space-y-4 animate-fadeIn">
            <span className="text-xs text-slate-500 font-medium">
              Real-time Groq LLM Assistant Consultations ({chats.length} active threads)
            </span>

            <div className="space-y-3">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  No chat conversations logged yet.
                </div>
              ) : (
                chats.map((c) => {
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  const userMsg = c.messages?.find((m) => m.role === "user");
                  return (
                    <div key={c._id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {c.user?.name || "Patient"}
                          </span>
                          <span className="text-slate-400">({c.user?.email || "Unknown"})</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : "Recently"}
                        </span>
                      </div>
                      {userMsg && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <strong className="text-slate-900 dark:text-white">Q: </strong>
                          {userMsg.content}
                        </p>
                      )}
                      {lastMsg && lastMsg.role === "assistant" && (
                        <p className="text-xs text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30 p-2.5 rounded-lg border border-teal-100 dark:border-teal-900/40 line-clamp-2">
                          <strong className="text-teal-700 dark:text-teal-400">Dr. DermAI: </strong>
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
