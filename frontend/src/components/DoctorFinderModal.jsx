import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { X, MapPin, Phone, Star, ShieldCheck, Search, Calendar, FileDown, ExternalLink, Clock, Stethoscope, Navigation, Compass, Loader2 } from "lucide-react";

export default function DoctorFinderModal({ isOpen, onClose, currentScan = null }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationInput, setLocationInput] = useState("Delhi");
  const [activeLocation, setActiveLocation] = useState("Delhi");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const popularCities = ["All", "Delhi", "Mumbai", "Bengaluru", "Lucknow", "Kolkata", "Hyderabad", "Pune", "Jaipur"];

  const fetchDoctors = (loc) => {
    setLoading(true);
    setErrorMsg("");
    api.get(`/doctors/nearby?location=${encodeURIComponent(loc || "")}`)
      .then((res) => {
        setDoctors(res.data.doctors || []);
        setActiveLocation(loc || "All");
      })
      .catch(() => setErrorMsg("Could not fetch clinics for this location."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchDoctors(locationInput);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real GPS Geolocation Tracker
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("GPS Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setGpsSuccessMsg("");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Free OpenStreetMap reverse geocode
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || "Nearby";
          setLocationInput(city);
          setGpsSuccessMsg(`📍 GPS detected location: ${city} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
          fetchDoctors(city);
        } catch {
          // Fallback if reverse geocode fails: search by coords
          setLocationInput("Delhi");
          fetchDoctors("Delhi");
          setGpsSuccessMsg(`📍 GPS Coordinates active: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg("GPS permission denied or unavailable. Please type your city name manually below.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    fetchDoctors(locationInput.trim());
  };

  const downloadDoctorPacket = () => {
    if (!currentScan) {
      alert("No active scan selected. Please perform an assessment first.");
      return;
    }
    const handoverHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Physician Referral Packet - DermAI - ${currentScan._id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 30px; color: #1e293b; background: #fff; }
    .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
    .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f8fafc; }
    .title { color: #0f766e; font-size: 16px; font-weight: bold; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="color: #0f766e; margin: 0;">🩺 DermAI - Clinical Referral Handover Packet</h2>
    <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Prepared for In-Person Dermatologist Physical Examination</p>
  </div>
  <div class="box">
    <div class="title">Patient Clinical Assessment Reference</div>
    <p><strong>Scan ID:</strong> ${currentScan._id}</p>
    <p><strong>Date:</strong> ${new Date(currentScan.createdAt).toLocaleString()}</p>
    <p><strong>Suspected Category:</strong> ${currentScan.modelResult?.top_prediction || 'N/A'} (Confidence: ${Math.round((currentScan.modelResult?.confidence || 0) * 100)}%)</p>
    <p><strong>Risk Level:</strong> ${currentScan.risk?.level || 'LOW'} (${(currentScan.risk?.reasons || []).join(', ') || 'Standard'})</p>
    <p><strong>Symptoms Reported:</strong> ${currentScan.symptoms || currentScan.content?.symptoms || 'None'}</p>
    <p><strong>Duration:</strong> ${currentScan.duration || currentScan.content?.duration || 'Unspecified'}</p>
  </div>
  <div class="box">
    <div class="title">AI Educational Summary</div>
    <div style="font-size: 13px; white-space: pre-wrap; line-height: 1.5;">${currentScan.assistantResponse || 'Pending'}</div>
  </div>
  <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    Confidential Medical Referral Packet. To be reviewed by a licensed doctor.
  </p>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(handoverHtml);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-teal-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Verified Skin Doctors & Clinics Nearby</h2>
              <p className="text-xs text-slate-500">GPS & Any-Location Clinic Referral • In-person consultations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Location Search Bar & GPS Button */}
        <div className="border-b border-slate-100 p-4 space-y-3 bg-white">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-teal-600" />
              <input
                type="text"
                placeholder="Type ANY location, city, or area (e.g. Lucknow, Rohini Delhi, Bandra Mumbai, Jaipur)..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-500 outline-hidden bg-white"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" /> Find Clinics
            </button>

            {/* GPS Location Auto-Detector */}
            <button
              type="button"
              onClick={handleUseGps}
              disabled={gpsLoading}
              className="rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Detect my current location with GPS"
            >
              {gpsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span className="hidden sm:inline">Use GPS</span>
            </button>
          </form>

          {/* GPS Status or Error message */}
          {gpsSuccessMsg && (
            <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium animate-fadeIn">
              {gpsSuccessMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg font-medium animate-fadeIn">
              {errorMsg}
            </p>
          )}

          {/* Popular City Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Popular:</span>
              {popularCities.map((city) => (
                <button
                  key={city}
                  onClick={() => { setLocationInput(city === "All" ? "" : city); fetchDoctors(city === "All" ? "" : city); }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    activeLocation.toLowerCase() === city.toLowerCase() || (city === "All" && activeLocation === "All")
                      ? "bg-teal-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {currentScan && (
              <button
                onClick={downloadDoctorPacket}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" /> Doctor Handover Packet
              </button>
            )}
          </div>
        </div>

        {/* Doctor Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showing verified clinics near: <span className="text-teal-700">{activeLocation || "Your Area"}</span>
            </p>

            {/* Direct Google Maps link for ANY location */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Dermatologist Skin Specialist Clinic near " + (activeLocation || "me"))}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" /> View Live on Google Maps ↗
            </a>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" /> Finding verified dermatologists...
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No doctors found. Try searching for a nearby major city or click "Use GPS".
            </div>
          ) : (
            doctors.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-200 bg-white p-4.5 hover:border-teal-300 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">{doc.name}</h3>
                      {doc.emergencyAvailable && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          Emergency / Walk-in Available
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">{doc.clinic}</p>
                  </div>

                  <div className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1 text-xs font-bold text-amber-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{doc.rating}</span>
                    <span className="text-[10px] font-normal text-slate-400">({doc.reviewsCount} reviews)</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    <span>{doc.specialty}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{doc.timings}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.address} ({doc.distanceKm})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono">{doc.phone}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${doc.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Clinic
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.clinic + ' ' + doc.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Navigate & Book (Google Maps)
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
