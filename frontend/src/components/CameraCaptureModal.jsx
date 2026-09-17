import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, X, RefreshCw } from "lucide-react";

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const startCamera = useCallback(async (facing) => {
    stopStream();
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera: " + err.message);
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    }
    return () => stopStream();
  }, [isOpen, facingMode, startCamera, stopStream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }, [stopStream, onCapture]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90">
          <div className="flex items-center gap-2 text-white">
            <Camera className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-sm">Take Photo</span>
          </div>
          <button
            onClick={() => { stopStream(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Video Viewfinder */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center px-6">
              <Camera className="h-12 w-12 text-red-400 mx-auto mb-3 opacity-60" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-4 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Grid overlay for alignment */}
              {ready && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border border-white/10" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/10" />
                  <div className="absolute right-1/3 top-0 bottom-0 border-l border-white/10" />
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/10" />
                  <div className="absolute bottom-1/3 left-0 right-0 border-t border-white/10" />
                </div>
              )}
              {!ready && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-3 border-teal-400 border-t-transparent rounded-full" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8 py-5 bg-slate-800/90">
          {/* Flip Camera */}
          <button
            onClick={flipCamera}
            disabled={!!error}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all disabled:opacity-30 cursor-pointer"
            title="Flip camera"
          >
            <RefreshCw className="h-5 w-5 text-white" />
          </button>

          {/* Shutter */}
          <button
            onClick={capture}
            disabled={!ready}
            className="w-16 h-16 rounded-full bg-white border-4 border-teal-400 hover:border-teal-300 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:border-gray-500 shadow-lg cursor-pointer"
            title="Capture photo"
          >
            <div className="w-full h-full rounded-full bg-white hover:bg-gray-100 transition-colors" />
          </button>

          {/* Close */}
          <button
            onClick={() => { stopStream(); onClose(); }}
            className="p-3 rounded-full bg-white/10 hover:bg-red-500/30 transition-all cursor-pointer"
            title="Cancel"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
