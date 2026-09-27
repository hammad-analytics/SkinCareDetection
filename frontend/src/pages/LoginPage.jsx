import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, Eye, Shield, Brain, Activity, ArrowRight, X, KeyRound, CheckCircle, EyeOff, EyeIcon } from "lucide-react";
import { api } from "../lib/api";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state (Email OTP flow)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=enter email, 2=enter otp, 3=new password, 4=success
  const [forgotForm, setForgotForm] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const set = (key, val) => setForm({ ...form, [key]: val });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        if (!form.name.trim()) { setError("Name is required"); setLoading(false); return; }
        if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) { setError("Valid phone number is required (min 10 digits)"); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        await register(form.name, form.email, form.password, form.phone);
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

  // Forgot Password handlers (OTP Flow)
  const openForgotPassword = () => {
    setForgotOpen(true);
    setForgotStep(1);
    setForgotForm({ email: form.email || "", otp: "", newPassword: "", confirmPassword: "" });
    setForgotError("");
    setForgotSuccess("");
  };

  const closeForgotPassword = () => {
    setForgotOpen(false);
    setForgotStep(1);
    setForgotError("");
    setForgotSuccess("");
  };

  // Step 1: Request 6-digit OTP
  const handleSendOTP = async () => {
    setForgotError("");
    setForgotSuccess("");
    if (!forgotForm.email.trim()) { setForgotError("Please enter your registered email address."); return; }
    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/send-otp", {
        email: forgotForm.email.trim()
      });
      setForgotSuccess(data.message || "OTP code sent successfully to your email.");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.error?.message || "Failed to send OTP. Please check your email address.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOTP = async () => {
    setForgotError("");
    if (!forgotForm.otp.trim() || forgotForm.otp.trim().length !== 6) {
      setForgotError("Please enter the 6-digit numeric OTP code.");
      return;
    }
    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/verify-otp", {
        email: forgotForm.email.trim(),
        otp: forgotForm.otp.trim()
      });
      if (data.verified) {
        setForgotStep(3);
        setForgotSuccess("OTP verified successfully! Please enter your new password.");
      }
    } catch (err) {
      setForgotError(err.response?.data?.error?.message || "Invalid or expired OTP. Please check and try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset password
  const handleForgotReset = async () => {
    setForgotError("");
    if (forgotForm.newPassword.length < 6) { setForgotError("Password must be at least 6 characters."); return; }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) { setForgotError("Passwords do not match."); return; }
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        email: forgotForm.email.trim(),
        newPassword: forgotForm.newPassword
      });
      setForgotStep(4);
    } catch (err) {
      setForgotError(err.response?.data?.error?.message || "Password reset failed. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const features = [
    { icon: Eye, title: "Intelligent Skin Analysis", desc: "Multi-model deep learning detection engine" },
    { icon: Shield, title: "Clinically Safe", desc: "Built-in safety filters & medical disclaimers" },
    { icon: Brain, title: "AI Dermatologist Chat", desc: "Gemini-powered bilingual consultation" },
    { icon: Activity, title: "Grad-CAM Heatmaps", desc: "Transparent visual model explanations" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left: Professional Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-14 py-12 text-white relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f766e 100%)" }}>
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-cyan-400/6 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/3 blur-2xl" />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Stethoscope className="h-6 w-6 text-teal-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">DermAI</h1>
          </div>
        </div>

        {/* Center: Hero Content */}
        <div className="relative z-10 -mt-8">
          <h2 className="text-3xl font-bold leading-tight mb-3 tracking-tight">
            Advanced Skin Health<br />Detection Platform
          </h2>
          <p className="text-base text-slate-300 mb-10 leading-relaxed max-w-md">
            Multimodal AI-powered diagnostics combining deep learning with expert medical knowledge for accurate skin condition assessment.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white/5 backdrop-blur-sm p-4 border border-white/8 hover:bg-white/8 transition-all duration-300">
                <Icon className="h-5 w-5 mb-2.5 text-teal-400" />
                <h3 className="font-semibold text-sm text-white/90">{title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Datasets + Credits */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Trained On</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">HAM10000 Dataset</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">ISIC 2019 Archive</span>
          </div>
          <p className="text-center text-[11px] text-slate-500">B.Tech Major Project 2026–2027 • Computer Science</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <div className="h-9 w-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-teal-600" />
            </div>
            <span className="text-xl font-bold text-slate-800">DermAI</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "login" ? "Sign in to continue to your dashboard" : "Get started with your skin health journey"}
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
                <input className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm" placeholder="Enter your full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
            )}
            {mode === "register" && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">+91</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 pl-12 pr-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={15}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-sm"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Min. 6 characters" : "What is password?"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link — only in login mode */}
            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 hover:shadow-lg disabled:bg-slate-400 disabled:shadow-none transition-all duration-200">
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

      {/* ═══ Forgot Password Modal (Secure OTP Flow) ═══ */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 transition-colors">
            {/* Close */}
            <button
              onClick={closeForgotPassword}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Step 1: Enter Email for OTP */}
            {forgotStep === 1 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Reset Password via OTP</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step 1 of 3: Enter your registered email</p>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
                    {forgotError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registered Email Address</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 text-sm transition-all focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden shadow-xs"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotForm.email}
                      onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    🔒 A secure 6-digit one-time verification code will be sent to your email.
                  </p>
                  <button
                    onClick={handleSendOTP}
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:bg-slate-400 cursor-pointer transition-all"
                  >
                    {forgotLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-4 w-4" />}
                    {forgotLoading ? "Sending OTP..." : "Send Verification OTP"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Enter 6-digit OTP */}
            {forgotStep === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Enter Verification Code</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step 2 of 3: Check your email inbox</p>
                  </div>
                </div>

                {forgotSuccess && (
                  <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                    ✉️ {forgotSuccess}
                  </div>
                )}

                {forgotError && (
                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
                    {forgotError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">6-Digit OTP Code</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 text-center text-2xl font-mono tracking-widest font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden shadow-xs"
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={forgotForm.otp}
                      onChange={(e) => setForgotForm({ ...forgotForm, otp: e.target.value.replace(/\D/g, "") })}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-slate-500">Valid for 5 minutes</span>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={forgotLoading}
                      className="font-medium text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={forgotLoading || forgotForm.otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:bg-slate-400 cursor-pointer transition-all"
                  >
                    {forgotLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle className="h-4 w-4" />}
                    {forgotLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Enter New Password */}
            {forgotStep === 3 && (
              <div className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <KeyRound className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Set New Password</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step 3 of 3: Identity verified</p>
                  </div>
                </div>

                {forgotError && (
                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 text-sm text-red-700 dark:text-red-300">
                    {forgotError}
                  </div>
                )}

                <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 p-3 text-xs text-green-700 dark:text-green-300">
                  ✅ OTP Verified for <strong>{forgotForm.email}</strong>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden shadow-xs"
                        type={showForgotPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={forgotForm.newPassword}
                        onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(!showForgotPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {showForgotPassword ? <EyeOff className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden shadow-xs"
                      type="password"
                      placeholder="Re-enter new password"
                      value={forgotForm.confirmPassword}
                      onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleForgotReset()}
                    />
                  </div>
                  <button
                    onClick={handleForgotReset}
                    disabled={forgotLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:bg-slate-400 cursor-pointer transition-all"
                  >
                    {forgotLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <KeyRound className="h-4 w-4" />}
                    {forgotLoading ? "Resetting..." : "Save & Reset Password"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {forgotStep === 4 && (
              <div className="animate-fadeIn text-center py-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950/50 border border-green-200 dark:border-green-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Password Reset Successful!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your password has been updated securely. You can now sign in with your new password.</p>
                <button
                  onClick={() => {
                    closeForgotPassword();
                    setForm({ ...form, email: forgotForm.email, password: "" });
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-700 transition-all cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                  Sign In Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

