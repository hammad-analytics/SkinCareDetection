import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

import { getConditionDetails, SKIN_CONDITIONS } from "../lib/diseaseDictionary";

const CLASS_NAMES = {
  acne: "Acne & Pimples (कील-मुहासे)",
  eczema: "Eczema (एक्जिमा / खुजली वाले चकत्ते)",
  psoriasis: "Psoriasis (सोरायसिस / सफेद पपड़ी)",
  tinea: "Fungal Infection (दाद / Ringworm)",
  vitiligo: "Vitiligo (सफेद दाग)",
  rosacea: "Rosacea (चेहरे की लाली)",
  urticaria: "Hives (पित्ती उछलना)",
  akiec: "Actinic Keratoses (धूप की खुरदरी त्वचा)",
  bcc: "Basal Cell Carcinoma (बेसल सेल ट्यूमर)",
  bkl: "Benign Keratosis (उम्र का सुरक्षित मस्सा)",
  df: "Dermatofibroma (सुरक्षित स्किन गांठ)",
  mel: "Melanoma (मेलेनोमा - गंभीर तिल)",
  nv: "Normal Mole (सामान्य तिल)",
  vasc: "Vascular Lesion (खून की नसों का लाल दाना)"
};

export function getClassName(code) {
  const detail = getConditionDetails(code);
  if (detail) {
    return `${detail.nameEn} • ${detail.nameHi}`;
  }
  return CLASS_NAMES[code] || code || "Unknown Condition";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, CLASS_NAMES }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
