"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, Menu, X, Palmtree, MapPin, Calendar } from "lucide-react";
import { useTripContext } from "@/context/TripContext";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { activeTrip, trips } = useTripContext();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/planner", label: "Trip Planner" },
    { href: "/trips", label: `My Trips (${trips.length})` },
    { href: "/destinations", label: "Destinations" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e6dfd5] transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white flex items-center justify-center shadow-travel transform transition-transform group-hover:scale-105">
            <Compass className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-stone-900 leading-none">
              Trip<span className="text-[#0d9488]">Planner</span>
            </h1>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5 flex items-center gap-1">
              <Palmtree className="w-3 h-3 text-[#0d9488]" />
              Screenshot-to-Itinerary AI
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#f7f2ea] p-1.5 rounded-2xl border border-[#e6dfd5]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#0d9488] text-white shadow-xs"
                    : "text-stone-700 hover:text-stone-900 hover:bg-white/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Badge */}
        <div className="hidden lg:flex items-center gap-3">
          {activeTrip && activeTrip.destination && (
            <Link
              href="/planner"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e0d6c8] text-xs font-bold text-stone-800 shadow-2xs hover:border-teal-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-[#ff6b5b]" />
              <span className="max-w-[120px] truncate">{activeTrip.destination}</span>
            </Link>
          )}
          <Link
            href="/planner"
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-travel transition-all duration-200 flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Open Planner</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#e6dfd5] bg-white px-4 py-4 space-y-2 animate-fade-in shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-[#0d9488] text-white"
                    : "text-stone-700 hover:bg-[#f7f2ea]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#e6dfd5]">
            <Link
              href="/planner"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-[#0d9488] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-travel"
            >
              <Sparkles className="w-4 h-4 text-amber-200" /> Open Trip Planner
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
