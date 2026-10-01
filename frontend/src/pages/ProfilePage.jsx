import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Footer } from "../components/Shared";
import {
  User,
  Mail,
  Shield,
  Activity,
  Calendar,
  Brain,
  Eye,
  Cpu,
  Edit3,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Save
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    api
      .get("/auth/profile")
      .then((r) => {
        setProfile(r.data);
        if (r.data.user) {
          setEditForm({
            name: r.data.user.name || "",
            phone: r.data.user.phone || ""
          });
        }
      })
      .catch(() => {
        setEditForm({
          name: user?.name || "",
          phone: user?.phone || ""
        });
      });
  }, [user]);

  const handleOpenEdit = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || ""
    });
    setMsg({ type: "", text: "" });
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      setMsg({ type: "error", text: "Name must be at least 2 characters long." });
      return;
    }
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await api.put("/auth/profile", {
        name: editForm.name.trim(),
        phone: editForm.phone.trim()
      });
      updateUser(res.data.user);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 3500);
    } catch (err) {
      setMsg({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to update profile. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const techStack = [
    { icon: Brain, label: "CNN Model", value: "EfficientNet-B0" },
    { icon: Cpu, label: "RNN Model", value: "Bidirectional GRU" },
    { icon: Eye, label: "Explainability", value: "Grad-CAM" },
    { icon: Activity, label: "Datasets", value: "HAM10000 & ISIC 2019" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex-1 space-y-6">

        {/* Success/Error Alert */}
        {msg.text && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-sm animate-fadeIn ${
              msg.type === "success"
                ? "bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300"
                : "bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="rounded-2xl bg-gradient-brand p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-xs shadow-inner">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{user?.name || "User"}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 border border-white/20">
                    {user?.role || "user"}
                  </span>
                </div>
                <p className="text-teal-100 text-sm">{user?.email || ""}</p>
                {user?.phone ? (
                  <p className="text-teal-200 text-xs mt-0.5 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> +91 {user.phone}
                  </p>
                ) : (
                  <p className="text-teal-200/70 text-xs mt-0.5">No phone number added</p>
                )}
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-xs transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 flex items-center justify-center">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Your Profile</h2>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (नाम)
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (मोबाइल नंबर)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={15}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="98765 43210"
                      className="w-full pl-12 pr-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Registered Email (Read Only)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats */}
        {profile?.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Account Details</h3>
            <button
              onClick={handleOpenEdit}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Full Name</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Email Address</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Phone Number</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user?.phone ? `+91 ${user.phone}` : "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400 dark:text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">System Role</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{user?.role || "user"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
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

      </div>
      <Footer />
    </div>
  );
}
