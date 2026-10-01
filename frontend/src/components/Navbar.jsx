import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, LayoutDashboard, PlusCircle, Clock, MessageCircle, User, LogOut, Menu, X, GitCompare, MapPin, Sun, Moon, ShieldCheck, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import DoctorFinderModal from "./DoctorFinderModal";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scan", label: "New Scan", icon: PlusCircle },
  { to: "/tracker", label: "Evolution Tracker", icon: GitCompare },
  { to: "/history", label: "History", icon: Clock },
  { to: "/chat", label: "AI Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xs transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors">
            <Stethoscope className="h-7 w-7" />
            <span>Derm<span className="text-teal-500">AI</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  location.pathname === to
                    ? "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}

            <button
              onClick={() => setDoctorModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/40 px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/60 transition-all cursor-pointer shadow-2xs ml-1"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" /> Find Doctor
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all border ml-1 ${
                  location.pathname === "/admin"
                    ? "bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 shadow-2xs"
                    : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border-purple-200 dark:border-purple-800"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Admin Panel
              </Link>
            )}

            {/* 3-Way Theme Toggle: Light -> Dark -> AMOLED Ekdum Dark */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title={
                theme === "amoled"
                  ? "Theme: Ekdum Dark (AMOLED Pitch Black) — Click for Light"
                  : theme === "dark"
                  ? "Theme: Slate Dark — Click for Ekdum Dark (AMOLED)"
                  : "Theme: Light — Click for Slate Dark"
              }
            >
              {theme === "amoled" ? (
                <Sparkles className="h-4 w-4 text-emerald-400" />
              ) : theme === "dark" ? (
                <Moon className="h-4 w-4 text-cyan-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </button>

            <div className="ml-2 h-5 w-px bg-slate-200 dark:bg-slate-700" />
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 md:hidden animate-fadeIn space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  location.pathname === to
                    ? "bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <button
              onClick={() => { setOpen(false); setDoctorModalOpen(true); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/40"
            >
              <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Find Nearby Doctors
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800"
              >
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Admin Control Center
              </Link>
            )}
            <button
              onClick={() => { toggleTheme(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {theme === "amoled" ? (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>Theme: Ekdum Dark (AMOLED Pitch Black)</span>
                </>
              ) : theme === "dark" ? (
                <>
                  <Moon className="h-4 w-4 text-cyan-400" />
                  <span>Theme: Slate Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Theme: Light Mode</span>
                </>
              )}
            </button>
            <button onClick={() => { setOpen(false); handleLogout(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        )}
      </header>

      {/* Nearby Doctor Modal */}
      <DoctorFinderModal isOpen={doctorModalOpen} onClose={() => setDoctorModalOpen(false)} />
    </>
  );
}
