"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Compass, Mail, Lock, User, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setErrorMsg("Please enter your Full Name.");
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      setErrorMsg("Supabase API keys are not configured in .env.local.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          router.push("/planner");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user && !data.session) {
          setSuccessMsg("Account created! Please check your email inbox to confirm registration.");
        } else {
          setSuccessMsg("Account created successfully! Redirecting to workspace...");
          setTimeout(() => router.push("/planner"), 1000);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F2EBDD] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-[#FAF6EE] rounded-[2.5rem] border-2 border-[#E8DFC8] shadow-2xl p-8 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER BRANDING */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#073B3A] text-white flex items-center justify-center mx-auto shadow-lg glow-emerald">
            <Compass className="w-9 h-9 text-[#19D3C5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#19D3C5] text-[#073B3A] uppercase mb-2">
              <Sparkles className="w-3 h-3 text-[#073B3A]" /> TRIP PLANNER STUDIO
            </div>
            <h1 className="font-display font-black text-3xl text-[#073B3A] tracking-tight">
              {mode === "signin" ? "Welcome Back Voyageur" : "Begin Your Next Journey"}
            </h1>
            <p className="text-xs text-[#073B3A]/70 font-semibold mt-1">
              {mode === "signin"
                ? "Sign in to access your saved itineraries and AI voyages"
                : "Create an account to save camera roll trips to the cloud"}
            </p>
          </div>
        </div>

        {/* TAB TOGGLE */}
        <div className="grid grid-cols-2 p-1.5 bg-[#E8DFC8]/50 rounded-2xl border border-[#E8DFC8]">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs font-black rounded-xl transition-all ${
              mode === "signin"
                ? "bg-[#073B3A] text-white shadow-md"
                : "text-[#073B3A]/70 hover:text-[#073B3A]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`py-2.5 text-xs font-black rounded-xl transition-all ${
              mode === "signup"
                ? "bg-[#073B3A] text-white shadow-md"
                : "text-[#073B3A]/70 hover:text-[#073B3A]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ALERT MESSAGES */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-start gap-3 text-xs text-rose-950 font-bold shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-start gap-3 text-xs text-emerald-950 font-bold shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-black uppercase text-[#073B3A] tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#073B3A]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#E8DFC8] bg-white text-[#073B3A] font-bold text-sm focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-[#073B3A] tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#073B3A]/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voyageur@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#E8DFC8] bg-white text-[#073B3A] font-bold text-sm focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-[#073B3A] tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#073B3A]/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-[#E8DFC8] bg-white text-[#073B3A] font-bold text-sm focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#FF2D78] hover:bg-[#E02068] text-white font-black text-sm shadow-lg glow-pink-shadow flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In to Studio" : "Create My Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
