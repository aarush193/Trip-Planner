"use client";

import React from "react";
import Link from "next/link";
import { Compass, Sparkles, X, Cloud, Bookmark, ArrowRight, ShieldCheck } from "lucide-react";

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "save_trip" | "my_trips" | null;
  tripDestination?: string;
}

export function AuthGateModal({
  isOpen,
  onClose,
  reason = "save_trip",
  tripDestination = "Paris, France",
}: AuthGateModalProps) {
  if (!isOpen) return null;

  const isSaveReason = reason === "save_trip";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#073B3A]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FAF6EE] rounded-[2.5rem] border-2 border-[#E8DFC8] shadow-2xl p-8 sm:p-10 space-y-6 animate-in zoom-in-95 duration-200">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-[#073B3A]/60 hover:text-[#073B3A] hover:bg-[#E8DFC8]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER ICON */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#073B3A] text-white flex items-center justify-center mx-auto shadow-lg glow-emerald">
            {isSaveReason ? (
              <Cloud className="w-8 h-8 text-[#19D3C5]" />
            ) : (
              <Bookmark className="w-8 h-8 text-[#FF2D78]" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#19D3C5] text-[#073B3A] uppercase">
              <Sparkles className="w-3 h-3 text-[#073B3A]" /> FREE VOYAGEUR ACCOUNT
            </div>
            <h2 className="font-display font-black text-2xl text-[#073B3A] tracking-tight pt-1">
              {isSaveReason ? `Save your ${tripDestination} Trip` : "Access Your Saved Voyages"}
            </h2>
            <p className="text-xs text-[#073B3A]/80 font-semibold leading-relaxed">
              {isSaveReason
                ? "Create a free account or log in to sync your custom itinerary to the cloud and access it from any device."
                : "Sign in to view, edit, and manage all your saved cloud itineraries across devices."}
            </p>
          </div>
        </div>

        {/* BENEFIT HIGHLIGHTS */}
        <div className="p-4 rounded-2xl bg-[#E8DFC8]/40 border border-[#E8DFC8] space-y-2 text-xs font-bold text-[#073B3A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF2D78] shrink-0" />
            <span>Automatic Cloud Backup & Itinerary Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#19D3C5] shrink-0" />
            <span>Edit schedules, days & slot places anytime</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#FF2D78] hover:bg-[#E02068] text-white font-black text-sm shadow-lg glow-pink-shadow flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Sign In / Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white hover:bg-stone-50 border-2 border-[#073B3A]/30 text-[#073B3A] font-black text-xs transition-colors"
          >
            Continue Editing as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
