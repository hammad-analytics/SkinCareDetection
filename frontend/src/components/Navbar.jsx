import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Stethoscope, LayoutDashboard, PlusCircle, Clock, MessageCircle, User, LogOut, Menu, X, GitCompare, MapPin, Sun, Moon } from "lucide-react";
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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-teal-700 hover:text-teal-800 transition-colors">
            <Stethoscope className="h-7 w-7" />
            <span>Derm<span className="text-teal-500">AI</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  location.pathname === to ? "bg-teal-50 text-teal-700 shadow-2xs" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}

            <button
              onClick={() => setDoctorModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-all cursor-pointer shadow-2xs ml-1"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-600" /> Find Doctor
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors ml-1 cursor-pointer text-slate-600"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            <div className="ml-2 h-5 w-px bg-slate-200" />
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="border-t bg-white px-4 py-3 md:hidden animate-fadeIn space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  location.pathname === to ? "bg-teal-50 text-teal-700 font-bold" : "text-slate-600"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <button
              onClick={() => { setOpen(false); setDoctorModalOpen(true); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-teal-700 bg-teal-50"
            >
              <MapPin className="h-4 w-4" /> Find Nearby Doctors
            </button>
            <button
              onClick={() => { toggleTheme(); setOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button onClick={() => { setOpen(false); handleLogout(); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer">
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
