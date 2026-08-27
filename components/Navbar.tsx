"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, Menu, X, MapPin } from "lucide-react";
import { useTripContext } from "@/context/TripContext";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeTrip, trips, user, userProfile, handleSignOut } = useTripContext();

  const displayName = userProfile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Voyageur";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/planner", label: "Trip Planner" },
    { href: "/trips", label: `My Trips (${trips.length})` },
    { href: "/destinations", label: "Destinations" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#073B3A] text-[#F5EFE5] border-b border-emerald-800/60 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#FF2D78] via-[#FF6B5B] to-[#19D3C5] text-white flex items-center justify-center shadow-md transform transition-transform group-hover:scale-105 glow-pink-shadow">
            <Compass className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-white leading-none">
              Trip<span className="text-[#FF2D78]">Planner</span>
            </h1>
            <p className="text-[11px] text-emerald-200/90 font-semibold tracking-wide flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3 h-3 text-[#19D3C5]" />
              Screenshot-to-Itinerary Studio
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#052e2c] p-1.5 rounded-2xl border border-emerald-700/50">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                  isActive
                    ? "bg-[#FF2D78] text-white shadow-md glow-pink-shadow"
                    : "text-emerald-100/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right User Profile / Auth & Planner CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-[#052e2c] border border-emerald-700/60 p-1 pl-3 rounded-2xl">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#19D3C5]" />
                {displayName}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-rose-900 text-xs font-black text-emerald-100 hover:text-white transition-colors border border-emerald-700/50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-2xl text-xs font-extrabold bg-[#052e2c] border border-emerald-700/50 text-white hover:border-[#19D3C5] transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/planner"
            className="px-4.5 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-[#FF2D78] to-[#FF6B5B] text-white shadow-md glow-pink-shadow transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:opacity-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Open Planner</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-emerald-100 hover:bg-white/10 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-800/60 bg-[#073B3A] px-4 py-4 space-y-2 animate-fade-in shadow-xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                  isActive
                    ? "bg-[#FF2D78] text-white"
                    : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between gap-2">
            {user ? (
              <>
                <span className="text-xs font-bold text-emerald-100">👤 {displayName}</span>
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-900 text-xs font-black text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#052e2c] border border-emerald-700 text-center text-xs font-extrabold text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
